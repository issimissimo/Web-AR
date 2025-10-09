import { onMount, createEffect, createSignal, createMemo, Show, on } from "solid-js"
import { useGame } from "@js/gameBase"
import { styled } from "solid-styled-components"
import { Color, Matrix4, Vector3, PositionalAudio, Euler } from "three"
import Reticle from "@js/reticle"
import { LoadAudioBuffer, LoadAudio } from "@tools/three/audioTools"
import { findMaterialByName } from "@tools/three/materialTools"
import Toolbar from "@views/ar-overlay/Toolbar"
import SceneManager from "@js/sceneManager"
import { Container } from "@components/smallElements"
import SvgIcon from "@components/SvgIcon"
import * as THREE from "three"
import { config } from "@js/config"
import { GLBFile } from "@tools/three/modelTools"
import { LoadTexture } from "@tools/three/textureTools"
import useOnce from "@hooks/SolidJS/useOnce"
import Message from "@components/Message"
import { DotLottieSolid } from "@lottiefiles/dotlottie-solid"

const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080, 0x000000]

// GAME parameters
const ARROW_HEIGHT = 0.07
const ARROW_SPEED = 0.04
const ARROW_OFFSET = new THREE.Vector3(0, -0.1, -0.3)
const GRAVITY = 0.008
const GROUND_Y = -1.5
const ARROW_BONUS = 2

const PLAYER_STATE = {
    NONE: "none",
    RUNNING: "running",
    WINNER: "winner",
    LOOSER: "looser",
}

// let playerState;
let balloons = []
let arrow = null
let isArrowFlying = false
let maxGameTime = 30000
let interval
let arrowModel = null

let arrowGlb
let balloonGlb

export default function Baloons(props) {
    const [lastSavedGameData, setLastSavedGameData] = createSignal([])
    const [showInstructions, setShowInstructions] = createSignal(false)

    // GAME variables
    const [arrowsLeft, setArrowsLeft] = createSignal(10)
    const [explodedBalloons, setExplodedBalloons] = createSignal(0)
    const [remainingTime, setRemainingTime] = createSignal(maxGameTime)
    const [playerState, setPlayerState] = createSignal(PLAYER_STATE.NONE)

    /*
     * Default DATA
     */
    const defaultGameData = []

    let popAudioBuffer
    let balloonExplosionAudioBuffer
    let whooshAudio

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("baloons", props.id, {
        onTap: () => {
            console.log("TAAPPP-1")
            if (props.enabled) {
                console.log("TAAPPP-2")
                switch (game.appMode) {
                    case "save":
                        if (props.selected) {
                            console.log("TAAPPP-3")
                            spawnModelOnTap()
                        }
                        break

                    case "load":
                        launchArrow()
                        break
                }
            }
        },

        renderLoop: () => loop(),
    })

    /*
     * On mount
     */
    onMount(async () => {
        // load balloon model
        const balloonAoTexture = await new LoadTexture("models/demo/Balloons/balloon_AO.webp", {
            flipY: false,
        })
        balloonGlb = await new GLBFile("models/demo/Balloons/balloon.glb", {
            aoMap: balloonAoTexture,
            aoMapChannel: 1,
        })

        // load dart model
        const arrowAoTexture = await new LoadTexture("models/demo/Balloons/dart_AO.webp", {
            flipY: false,
        })
        arrowGlb = await new GLBFile("models/demo/Balloons/dart.glb", {
            aoMap: arrowAoTexture,
        })
        arrowModel = arrowGlb.model

        // load audio
        popAudioBuffer = await new LoadAudioBuffer("sounds/pop.ogg")
        balloonExplosionAudioBuffer = await new LoadAudioBuffer("sounds/balloon-explosion.ogg")
        whooshAudio = await new LoadAudio("sounds/whoosh.ogg", SceneManager.listener, {
            volume: 0.1,
        })

        // Setup data
        await game.loadGameData()
        if (!game.gameData()) {
            console.log("siccome non abbiamo caricato niente settiamo i dati di default")
            // load default data
            game.setGameData(defaultGameData)
        }

        // reset
        setLastSavedGameData([...game.gameData()])

        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()
    })

    /*
     * On ENABLED
     */
    useOnce(
        () => props.enabled,
        () => {
            console.log("BALOONS ENABLED!")

            if (
                game.appMode === "load" ||
                (game.appMode === "save" && game.gameData().length === 0)
            ) {
                setShowInstructions(true)
            } else {
                start()
            }

            handleBlurredCover()
            handleReticle()
        }
    )

    function start() {
        // wait a little before to spawn loaded models
        setTimeout(() => {
            if (game.gameData().length > 0) spawnAllModels()
        }, 250)

        // Start the game!
        if (game.appMode === "load") {
            // decrease timeout
            interval = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev > 0) {
                        return prev - 1000
                    }
                    clearInterval(interval)
                    return 0
                })
            }, 1000)

            setPlayerState(PLAYER_STATE.RUNNING)
        }
    }

    const handleCloseInstructions = () => {
        setShowInstructions(() => false)
        handleReticle()
        handleBlurredCover()
        start()
    }

    const hasUnsavedChanges = createMemo(
        () => JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
    )

    const handleUndo = () => {
        // super
        game.onUndo()
        // remove last from scene
        game.removePreviousFromScene()
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1))

        console.log("UNDO! ->>", game.gameData())
    }

    const handleSave = async () => {
        // save data
        await game.saveGameData()
        // reset
        setLastSavedGameData([...game.gameData()])
    }

    //#region [LOOP]
    /*
     * LOOP
     */
    function loop() {
        if (props.enabled) {
            balloonGlb.animate()

            if (game.appMode == "load") {
                if (playerState() === PLAYER_STATE.RUNNING) {
                    updateArrow()

                    // end
                    if (remainingTime() <= 0) endGameLooser()
                }
            }
        }
    }

    //#region [Load models]
    /*
     * Spawn loaded models
     */
    function spawnAllModels() {
        const gameData = game.gameData()
        let currentIndex = 0

        function loadNextBatch() {
            const batchSize = 1 // Carica 1 modello per frame
            const endIndex = Math.min(currentIndex + batchSize, gameData.length)

            for (let i = currentIndex; i < endIndex; i++) {
                const assetData = gameData[i]

                let newModel = balloonGlb.clone({ randomizeTime: true })
                newModel.matrixAutoUpdate = false

                // position
                const diffMatrix = new Matrix4()
                diffMatrix.fromArray(assetData.diffMatrix.elements)
                const globalMatrix = game.getGlobalMatrixFromOffsetMatrix(
                    props.referenceMatrix,
                    diffMatrix
                )
                newModel.matrix.copy(globalMatrix)

                // rotation
                newModel.rotation.y = Math.random() * Math.PI * 2

                // color
                const colorIndex = assetData.color
                newModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.name === "balloon") {
                        const newModelColor = balloonColors[colorIndex]
                        child.material = child.material.clone()
                        child.material.color = new Color(newModelColor)
                    }
                })

                // audio
                const audio = new PositionalAudio(SceneManager.listener)
                audio.setBuffer(popAudioBuffer)
                newModel.add(audio)

                game.addToScene(newModel)
                balloons.push(newModel)

                audio.play()
            }

            currentIndex = endIndex

            // Se ci sono ancora modelli da caricare, continua nel prossimo frame
            if (currentIndex < gameData.length) {
                // requestAnimationFrame(loadNextBatch);
                setTimeout(() => {
                    loadNextBatch()
                }, 200)
            } else {
                console.log("Tutti i modelli spawnati!")

                // Init GAME!!!
                if (game.appMode == "load") {
                    // arrowsLeft = balloons.length + ARROW_BONUS;
                    setArrowsLeft(balloons.length + ARROW_BONUS)
                    // Crea freccia iniziale
                    createArrow()
                }
            }
        }

        loadNextBatch()
    }

    //#region [Spawn on TAP]
    /*
     * Spawn on TAP
     */
    function spawnModelOnTap() {
        const p = new Vector3().setFromMatrixPosition(Reticle.getHitMatrix())
        console.log("SPAWN...", p)

        // clone model on hitMatrix with random Y rotation
        const newModel = balloonGlb.clone({
            position: new Vector3().setFromMatrixPosition(Reticle.getHitMatrix()),
            rotation: new Euler(0, Math.random() * Math.PI * 2, 0),
            randomizeTime: true,
        })

        // random color
        let colorIndex
        newModel.traverse((child) => {
            if (child.isMesh && child.material && child.material.name === "balloon") {
                colorIndex = Math.floor(Math.random() * balloonColors.length)
                const newModelColor = balloonColors[colorIndex]
                child.material = child.material.clone() // clone per non cambiare il materiale originale
                child.material.color = new Color(newModelColor)
            }
        })

        // add model to scene
        game.addToScene(newModel)

        // pop sound
        const audio = new PositionalAudio(SceneManager.listener)
        audio.setBuffer(popAudioBuffer)
        newModel.add(audio)
        audio.play()

        // Set gameData
        const diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, newModel)
        const newData = {
            color: colorIndex,
            diffMatrix: diffMatrix,
        }
        game.setGameData((prev) => [...prev, newData])

        console.log("UNDO VISIBLE:", game.gameData().length > 0)
    }

    function createArrow() {
        // console.log("*********START************")

        if (playerState() !== PLAYER_STATE.RUNNING) {
            return
        }

        if (arrow) {
            // Se era attaccata alla camera, rimuovila da lì
            if (arrow.parent === SceneManager.camera) {
                SceneManager.camera.remove(arrow)
            } else {
                SceneManager.scene.remove(arrow)
            }
        }

        arrow = arrowModel

        arrow.position.copy(ARROW_OFFSET) // Offset dalla camera
        arrow.rotation.set(0, 0, 0) // Rotazione relativa alla camera

        // ✅ ATTACCA alla camera!
        SceneManager.camera.add(arrow)

        arrow.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            isFlying: false,
        }

        isArrowFlying = false
    }

    function launchArrow() {
        if (isArrowFlying || arrowsLeft() <= 0) return

        if (playerState() !== PLAYER_STATE.RUNNING) return

        whooshAudio.play()

        // ✅ PRIMA ottieni i valori mondiali
        const worldPosition = new THREE.Vector3()
        const worldQuaternion = new THREE.Quaternion()

        arrow.getWorldPosition(worldPosition)
        arrow.getWorldQuaternion(worldQuaternion) // ← PRIMA ottieni il quaternion!

        // ✅ POI calcola la direzione con il quaternion CORRETTO
        const direction = new THREE.Vector3(0, 0, -1)
        direction.applyQuaternion(worldQuaternion) // ← ORA ha i valori giusti!

        // ✅ DOPO stacca dalla camera
        SceneManager.camera.remove(arrow)
        SceneManager.scene.add(arrow)

        // ✅ Imposta posizione e rotazione
        arrow.position.copy(worldPosition)
        arrow.quaternion.copy(worldQuaternion) // ← Usa direttamente il quaternion!

        setArrowsLeft((prev) => prev - 1)

        // Velocità nella direzione della camera
        const horizontalSpeed = ARROW_SPEED
        const verticalBoost = ARROW_HEIGHT

        arrow.userData.velocity.set(
            direction.x * horizontalSpeed,
            direction.y * horizontalSpeed + verticalBoost, // Componente Y + boost verticale
            direction.z * horizontalSpeed
        )

        arrow.userData.isFlying = true
        isArrowFlying = true
    }

    function updateArrow() {
        if (!isArrowFlying || !arrow.userData.isFlying) return

        // Applica la gravità
        arrow.userData.velocity.y -= GRAVITY

        // Aggiorna la posizione
        arrow.position.add(arrow.userData.velocity)

        // Ruota leggermente la freccia per seguire la traiettoria
        arrow.rotation.x += 0.01

        // Controlla le collisioni con i palloncini
        checkCollisions()

        // Rimuovi la freccia se va troppo in basso o troppo lontano
        if (arrow.position.y < GROUND_Y || arrow.position.z < -15) {
            setTimeout(() => {
                // console.log("arrowLeft:", arrowsLeft())
                if (arrowsLeft() > 0) {
                    createArrow()
                } else {
                    endGameLooser()
                }
            }, 500)
        }
    }

    function checkCollisions() {
        const arrowBox = new THREE.Box3().setFromObject(arrow)

        for (let i = balloons.length - 1; i >= 0; i--) {
            const balloon = balloons[i]
            const balloonBox = new THREE.Box3().setFromObject(balloon)

            if (arrowBox.intersectsBox(balloonBox)) {
                setExplodedBalloons((prev) => prev + 1)

                // Collisione! Rimuovi il palloncino
                const mat = findMaterialByName(balloon, "balloon")
                const color = mat.color

                // play audio explosion
                const audio = new PositionalAudio(SceneManager.listener)
                audio.setBuffer(balloonExplosionAudioBuffer)
                balloon.add(audio)
                audio.play()

                SceneManager.scene.remove(balloon)
                balloons.splice(i, 1)

                // Effetto di "pop" - piccola animazione
                createPopEffect(balloon.position, color)

                if (explodedBalloons() == game.gameData().length) {
                    // console.log("HAI VINTO!")

                    endGameWinner()
                }
            }
        }
    }

    function createPopEffect(position, color) {
        // Crea un effetto visivo semplice quando un palloncino viene colpito
        const particles = []
        const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8)

        for (let i = 0; i < 20; i++) {
            const particleMaterial = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
            })
            const particle = new THREE.Mesh(particleGeometry, particleMaterial)
            particle.position.copy(position)

            const direction = new THREE.Vector3
                (
                    (Math.random() - 0.5) * 2,
                    Math.random(),
                    (Math.random() - 0.5) * 2
                )
                .normalize()
                .multiplyScalar(0.1)

            particle.userData = { velocity: direction, life: 1.0 }
            SceneManager.scene.add(particle)
            particles.push(particle)
        }

        // Anima e rimuovi le particelle
        const animateParticles = () => {
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i]
                particle.position.add(particle.userData.velocity)
                particle.userData.velocity.y -= 0.005 // Gravità sulle particelle
                particle.userData.life -= 0.05
                particle.material.opacity = particle.userData.life

                if (particle.userData.life <= 0) {
                    SceneManager.scene.remove(particle)
                    particles.splice(i, 1)
                }
            }

            if (particles.length > 0) {
                requestAnimationFrame(animateParticles)
            }
        }
        animateParticles()
    }

    function endGameWinner() {
        setTimeout(() => {
            setPlayerState(PLAYER_STATE.WINNER)
            clearInterval(interval)
            console.log("HAI VINTO!!!")
        }, 500)
    }

    function endGameLooser() {
        setTimeout(() => {
            setPlayerState(PLAYER_STATE.LOOSER)
            clearInterval(interval)
            console.log("HAI PERSO!!!")
        }, 500)
    }

    //region RETICLE AND BLURRED COVER

    const handleReticle = () => {
        if (showInstructions() || game.appMode === "load") {
            Reticle.setEnabled(false)
        } else {
            Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET)
            Reticle.setVisible(true)
        }
    }

    const handleBlurredCover = () => {
        if (showInstructions()) {
            game.handleBlurredCover({
                visible: true,
                showHole: false,
                priority: 999,
            })
        } else {
            game.handleBlurredCover({
                visible: false,
            })
        }
    }

    createEffect(
        on(
            () => [props.enabled, props.selected],
            ([enabled, selected]) => {
                if (
                    (game.appMode === "load" && enabled && game.gameDetails.interactable) ||
                    (game.appMode === "save" && selected)
                ) {
                    handleReticle()
                    handleBlurredCover()
                }
            }
        )
    )

    /*
     * RENDER
     */

    const MessageContainer = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        /* padding: 2em; */
    `

    const InfoContainer = styled("div")`
        display: flex;
        box-sizing: border-box;
        align-items: center;
        gap: 2rem;
        justify-content: center;
        margin-top: 0.5rem;
    `

    const InfoItem = styled("div")`
        display: flex;
        box-sizing: border-box;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
    `

    //#region [Author UI]

    const AuthorUI = () => {
        return (
            <Show
                when={showInstructions()}
                fallback={
                    <>
                        <InfoContainer>
                            <InfoItem style={{ gap: "0.5rem" }}>
                                <SvgIcon
                                    src={"icons/balloon.svg"}
                                    color={"var(--color-secondary)"}
                                    size={25}
                                />
                                {game.gameData().length}
                            </InfoItem>
                        </InfoContainer>
                        <Toolbar
                            buttons={["undo", "save"]}
                            onUndo={handleUndo}
                            onSave={handleSave}
                            undoActive={game.gameData().length > 0}
                            saveActive={hasUnsavedChanges()}
                        />
                    </>
                }
            >
                <MessageContainer>
                    <Message
                        style={{ height: "auto" }}
                        svgIcon={"icons/tap.svg"}
                        showDoneButton={true}
                        onDone={handleCloseInstructions}
                    >
                        Fai TAP sullo schermo per posizionare i palloncini nello spazio intorno a
                        te. L'utente dovrà poi farli scoppiare in un tempo prestabilito.
                    </Message>
                </MessageContainer>
            </Show>
        )
    }

    //#region [User UI]

    const UserUI = () => {
        return (
            <Show
                when={showInstructions()}
                fallback={
                    <Container>
                        {(() => {
                            switch (playerState()) {
                                case PLAYER_STATE.WINNER:
                                    return (
                                        <DotLottieSolid src="lottie/winner.lottie" autoplay />
                                    )
                                case PLAYER_STATE.LOOSER:
                                    return (
                                        <DotLottieSolid src="lottie/winner.lottie" autoplay />
                                    )
                                default:
                                    return (
                                        <InfoContainer>
                                            <InfoItem style={{ gap: "0.5rem" }}>
                                                <SvgIcon
                                                    src={"icons/dart.svg"}
                                                    color={"var(--color-secondary)"}
                                                    size={25}
                                                />
                                                {arrowsLeft()}
                                            </InfoItem>
                                            <InfoItem style={{ gap: "0.5rem" }}>
                                                <SvgIcon
                                                    src={"icons/balloon.svg"}
                                                    color={"var(--color-secondary)"}
                                                    sizeY={25}
                                                />
                                                {explodedBalloons()} / {game.gameData().length}
                                            </InfoItem>
                                            <InfoItem style={{ gap: "0.5rem" }}>
                                                <SvgIcon
                                                    src={"icons/time.svg"}
                                                    color={"var(--color-secondary)"}
                                                    size={20}
                                                />
                                                {remainingTime() / 1000}
                                            </InfoItem>
                                        </InfoContainer>
                                    )
                            }
                        })()}
                    </Container>
                }
            >
                <MessageContainer>
                    <Message
                        style={{ height: "auto" }}
                        svgIcon={"icons/tap.svg"}
                        showDoneButton={true}
                        onDone={handleCloseInstructions}
                    >
                        Fai TAP sullo schermo per lanciare le freccette e fare scoppiare tutti i
                        palloncini entro il tempo massimo.
                    </Message>
                </MessageContainer>
            </Show>
        )
    }

    

    const renderView = () => {
        return (
            <Show when={props.enabled}>
                <Show when={game.appMode === "save" && props.selected}>
                    <AuthorUI />
                </Show>
                <Show when={game.appMode === "load"}>
                    <UserUI />
                </Show>
            </Show>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
