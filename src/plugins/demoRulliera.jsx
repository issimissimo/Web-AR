import { onMount, createSignal, createEffect, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import SceneManager from "@js/sceneManager"
import Message from "@components/Message"
import * as THREE from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { Vector3, Euler } from "three"
import { GLBFile } from "@tools/three/modelTools"
import { LoadTexture } from "@tools/three/textureTools"
import { LoadPositionalAudio } from "@tools/three/audioTools"
import { setMaterialsShadows } from "@tools/three/materialTools"
import ContactShadowsXR from "@tools/three/ContactShadowsXR"
import ClippingReveal from "@tools/three/ClippingReveal"
import Toolbar from "@views/ar-overlay/Toolbar"
import { RecreateMaterials } from "@tools/three/materialTools"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export default function demoRulliera(props) {
    // Parameters
    const materialOffset = 0.008
    const useVideo = true
    const globalScale = 0.1

    const clock = new THREE.Clock(!useVideo)

    const materialsToAnimateOffset = []

    const mixers = []
    const actions = []

    const draco = new DRACOLoader()
    draco.setDecoderConfig({ type: "js" })
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")

    let CASSONI, BARRIERE, RULLI_SCATOLE, GROUND, TENDE_RAGGI
    let group, mixer, isReady, action, gltf, aoTexture, video, videoTexture

    const [showInstructions, setShowInstructions] = createSignal(true)
    const [spawned, setSpawned] = createSignal(false)

    const handleCloseInstructions = () => {
        setShowInstructions(false)
        handleReticle()
        handleBlurredCover()
    }

    const handleUndo = () => {
        game.onUndo() // audio

        // if (audioRobot) audioRobot.stop()
        // robotGlb.resetAnimations()
        // game.removePreviousFromScene()
        setSpawned(false)
        handleReticle()
    }

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("demoRulliera", props.id, {
        onTap: () => {
            if (
                Reticle.visible() &&
                Reticle.isHitting() &&
                !showInstructions() &&
                !spawned()
            ) {
                game.super.onTap() // audio

                const hitMatrix = Reticle.getHitMatrix()
                spawnModel(hitMatrix)
                setSpawned(true)
                handleReticle()
            }
        },

        renderLoop: () => {
            if (props.enabled && spawned()) {
                if (isReady && mixer) {
                    const dt = clock.getDelta()

                    // L'animazione procede fluida, indipendente dal video
                    mixers.forEach((mx) => {
                        mx.update(dt)
                    })

                    // Sincronizza il video al tempo dell'animazione
                    syncVideoToAnimation()
                }

                // Anima tutti i materiali nell'array
                materialsToAnimateOffset.forEach((material) => {
                    const offsetSpeed = materialOffset // Regola la velocità

                    // Lista di tutte le possibili texture maps
                    const textureMaps = [
                        "map", // Diffuse/Color
                        "normalMap", // Normal
                        "roughnessMap", // Roughness
                        "metalnessMap", // Metalness
                        "emissiveMap", // Emissive
                        "bumpMap", // Bump
                    ]

                    // Anima l'offset su tutte le texture presenti
                    textureMaps.forEach((mapName) => {
                        if (material[mapName]) {
                            material[mapName].offset.x += offsetSpeed
                        }
                    })
                })
            }
        },

        close: () => {
            // if (shadows) shadows.dispose()
            // if (audioRobot) audioRobot.stop()
        },
    })

    /*
     * On mount
     */
    onMount(async () => {
        group = new THREE.Group()

        /*
         * CASSONI
         */
        aoTexture = await loadTexture("models/demo/Rulliera/CASSONE_AO.webp")
        aoTexture.flipY = false
        gltf = await loadGLTF("models/demo/Rulliera/CASSONI_001.glb")
        CASSONI = gltf.scene
        CASSONI = RecreateMaterials(CASSONI, {
            aoMap: aoTexture,
            aoMapChannel: 1,
            aoMapIntensity: 1.15,
        })
        group.add(CASSONI)

        /*
         * GROUND
         */
        const groundAlphaTexture = await loadTexture(
            "models/demo/Rulliera/GROUND_AO.webp"
        )
        const groundMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x000000),
            alphaMap: groundAlphaTexture,
            transparent: true,
        })
        gltf = await loadGLTF("models/demo/Rulliera/GROUND.glb")
        GROUND = gltf.scene
        GROUND.traverse((child) => {
            if (child.isMesh) {
                child.material = groundMat
            }
        })
        group.add(GROUND)

        /*
         * BARRIERE
         */
        aoTexture = await loadTexture("models/demo/Rulliera/BARRIERA_AO.webp")
        aoTexture.flipY = true
        gltf = await loadGLTF("models/demo/Rulliera/BARRIERE_001.glb")
        BARRIERE = gltf.scene
        BARRIERE = RecreateMaterials(BARRIERE, {
            aoMap: aoTexture,
            aoMapChannel: 1,
            aoMapIntensity: 1,
        })
        group.add(BARRIERE)

        /*
         * GREEN LIGHTS ALLE BARRIERE
         */
        // green point light at center, 1m high
        const greenLight1 = new THREE.PointLight(
            0x00ff00,
            1 * globalScale * globalScale,
            4 * globalScale,
            4
        )
        greenLight1.position.set(-0.6, 0.8, 0)
        group.add(greenLight1)

        const redLight3 = new THREE.PointLight(
            0xf60d0d,
            2 * globalScale * globalScale,
            4 * globalScale,
            4
        )
        redLight3.position.set(-0.65, 1.4, 0)
        group.add(redLight3)

        /*
         * ANIM TENDE E RAGGI
         */
        gltf = await loadGLTF("models/demo/Rulliera/TENDE_RAGGI_001.glb")
        TENDE_RAGGI = gltf.scene
        group.add(TENDE_RAGGI)
        mixer = new THREE.AnimationMixer(TENDE_RAGGI)
        mixers.push(mixer)
        gltf.animations.forEach((clip) => {
            action = mixer.clipAction(clip)
            actions.push(action)
        })

        /*
         * ANIM RULLI E SCATOLE
         */
        // 1. Crea l'elemento video
        video = document.createElement("video")
        video.src = "models/demo/Rulliera/ANIM_RULLI_SCATOLE_LM.mp4"
        video.crossOrigin = "anonymous"
        video.loop = true
        video.muted = true
        video.playsInline = true
        video.preload = "auto"
        // 2. Crea la VideoTexture
        videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter
        videoTexture.colorSpace = THREE.SRGBColorSpace
        videoTexture.flipY = true
        // 3. Carica il modello GLB
        gltf = await loadGLTF("models/demo/Rulliera/ANIM_RULLI_SCATOLE_005.glb")
        RULLI_SCATOLE = gltf.scene
        group.add(RULLI_SCATOLE)
        // 4. Applica la VideoTexture
        RULLI_SCATOLE.traverse((child) => {
            if (child.isMesh) {
                child.material.aoMap = videoTexture
                child.material.aoMap.channel = 1
                child.material.aoMapIntensity = 1
                child.material.needsUpdate = true
            }
        })

        addMaterialToOffsetAnimation(RULLI_SCATOLE)

        mixer = new THREE.AnimationMixer(RULLI_SCATOLE)
        mixers.push(mixer)
        gltf.animations.forEach((clip) => {
            action = mixer.clipAction(clip)
            actions.push(action)
        })

        // Attendi che il video sia pronto...
        video.addEventListener("canplaythrough", onVideoReady, { once: true })
        video.load()

        function onVideoReady() {
            /*
             * Don't forget to call "game.setInitialized()" at finish
             */
            game.setInitialized()
            test()
        }
    })

    //region RETICLE AND BLURRED COVER

    const handleReticle = () => {
        if (showInstructions() || spawned()) {
            Reticle.setEnabled(false)
        } else {
            Reticle.setup(Reticle.MESH_TYPE.RINGS, {
                size: 0.4,
                ringNumber: 4,
                ringThickness: 0.2,
                color: 0xf472b6,
            })
            Reticle.setSurfType(Reticle.SURF_TYPE_MODE.FLOOR)
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
                    (game.appMode === "load" &&
                        enabled &&
                        game.gameDetails.interactable) ||
                    (game.appMode === "save" && selected)
                ) {
                    handleReticle()
                    handleBlurredCover()
                }
            }
        )
    )

    //region RENDER

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    `

    const View = () => {
        return (
            <Show
                when={showInstructions()}
                fallback={
                    <Toolbar
                        id="toolbar"
                        buttons={["undo"]}
                        onUndo={handleUndo}
                        undoActive={spawned()}
                    />
                }
            >
                <Container>
                    <Message
                        style={{ height: "auto" }}
                        svgIcon={"icons/tap.svg"}
                        showDoneButton={true}
                        onDone={handleCloseInstructions}
                    >
                        Fai TAP sullo schermo per posizionare la Rulliera su un
                        piano. <br></br> Evita i piani troppo Evita superfici
                        riflettenti o uniformi.
                    </Message>
                </Container>
            </Show>
        )
    }

    const renderView = () => {
        return (
            <Show when={props.enabled}>
                <Show when={game.appMode === "save" && props.selected}>
                    <View />
                </Show>
                <Show when={game.appMode === "load"}>
                    <View />
                </Show>
            </Show>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)

    //region FUNCTIONS
    function syncVideoToAnimation() {
        const animTime = action.time
        const clipDuration = action.getClip().duration
        const videoDuration = video.duration

        // console.log(animTime, clipDuration, videoDuration)

        if (!isFinite(videoDuration) || videoDuration === 0) return

        // Calcola il tempo target del video (gestisce anche durate diverse)
        // Se hanno la stessa durata, usa direttamente animTime
        // Se sono diverse, normalizza
        let targetVideoTime

        if (Math.abs(clipDuration - videoDuration) < 0.1) {
            // Durate simili: sincronizza direttamente
            targetVideoTime = animTime % videoDuration
        } else {
            // Durate diverse: normalizza al progresso 0-1
            const progress = (animTime % clipDuration) / clipDuration
            targetVideoTime = progress * videoDuration
        }

        // Correggi solo se la differenza è significativa (evita micro-seeking continuo)
        const drift = Math.abs(video.currentTime - targetVideoTime)
        const DRIFT_THRESHOLD = 0.1 // 100ms di tolleranza

        if (drift > DRIFT_THRESHOLD) {
            video.currentTime = targetVideoTime
        }
    }

    function addMaterialToOffsetAnimation(model) {
        // Trova tutti i materiali con "animOffsetX" nel nome
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const material = child.material

                // Controlla se il nome del materiale contiene "animOffsetX"
                if (material.name && material.name.includes("animOffsetX")) {
                    materialsToAnimateOffset.push(material)
                    console.log("Materiale aggiunto:", material.name)
                }
            }
        })
    }

    async function loadTexture(url) {
        return new Promise((resolve, reject) => {
            new THREE.TextureLoader().load(url, resolve, undefined, reject)
        })
    }

    async function loadGLTF(url) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader()
            loader.setDRACOLoader(draco)
            loader.load(url, resolve, undefined, reject)
        })
    }

    // function spawnModel(matrix) {
    //     const position = new Vector3()
    //     position.setFromMatrixPosition(matrix)

    //     const rotation = new Euler()
    //     rotation.setFromRotationMatrix(matrix)

    //     loadedModel.position.copy(position)
    //     loadedModel.rotation.copy(rotation)
    //     loadedModel.rotateY(Math.PI / 2)
    //     setMaterialsShadows(loadedModel, true)
    //     game.addToScene(loadedModel)

    //     loadedModel.add(audioRobot)
    //     audioRobot.play()

    //     setSpawned(true)

    //     shadows = new ContactShadowsXR(
    //         SceneManager.scene,
    //         SceneManager.renderer,
    //         {
    //             position: position,
    //             resolution: 512,
    //             blur: 2,
    //             animate: true,
    //             updateFrequency: 2,
    //         }
    //     )

    //     clippingReveal = new ClippingReveal(
    //         loadedModel,
    //         SceneManager.renderer,
    //         {
    //             ringsRadius: 0.2,
    //             ringNumber: 4,
    //             ringThickness: 0.2,
    //             ringsColor: 0xf472b6,
    //             duration: 2.0,
    //             autoStart: true,
    //             startDelay: 200,
    //             fadeOutDuration: 2,
    //             onComplete: () => console.log("Reveal completed"),
    //         }
    //     )
    // }

    function spawnModel(matrix) {
        // Resetta tutto
        video.currentTime = 0
        if (mixer) mixer.setTime(0)

        // Avvia il video (anche se poi lo controlliamo noi)
        video.play().catch((e) => console.error("Errore play:", e))

        // Avvia animazione e clock
        // action.play();
        actions.forEach((act) => {
            act.play()
        })

        clock.start()
        isReady = true

        game.addToScene(group)

        group.position.set(0, -0.1, 0)

        group.scale.set(globalScale, globalScale, globalScale)
    }

    function test() {
        // Resetta tutto
        video.currentTime = 0
        if (mixer) mixer.setTime(0)

        // Avvia il video (anche se poi lo controlliamo noi)
        video.play().catch((e) => console.error("Errore play:", e))

        // Avvia animazione e clock
        // action.play();
        actions.forEach((act) => {
            act.play()
        })

        clock.start()
        isReady = true

        // const boxGeom = new THREE.BoxGeometry(1, 1, 1)
        // const boxMat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        // const cube = new THREE.Mesh(boxGeom, boxMat)
        // group.add(cube)

        game.addToScene(group)

        group.position.set(0, 0, -1)
        group.rotation.y = Math.PI / 2

        group.scale.set(globalScale, globalScale, globalScale)

        setSpawned(true)
    }
}
