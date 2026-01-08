import { onMount, createSignal, createEffect, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import Message from "@components/Message"
import * as THREE from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { Vector3, Euler } from "three"
import { LoadPositionalAudio } from "@tools/three/audioTools"
import Toolbar from "@views/ar-overlay/Toolbar"
import { RecreateMaterials } from "@tools/three/materialTools"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import HorizontalSlider from "@components/HorizontalSlider"
import ToggleButton from "@components/ToggleButton"
import SceneManager from "@js/sceneManager"

const BARRRIERA_TYPE = {
    MICRON: "MICRON",
    STANDARD: "STANDARD",
}

export default function demoRulliera(props) {

    // Parameters
    const materialOffset = 0.008
    const useVideo = true
    const lightsIntensity = 0.5

    const clock = new THREE.Clock(!useVideo)

    const materialsToAnimateOffset = []

    const mixers = []
    const actions = []

    const draco = new DRACOLoader()
    draco.setDecoderConfig({ type: "js" })
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")

    let CASSONI,
        BARRIERE_STANDARD,
        BARRIERE_MICRON,
        RULLI_SCATOLE,
        GROUND,
        TENDE_RAGGI,
        LIGHT_GREEN,
        LIGHT_RED
    let group,
        mixer,
        isReady,
        action,
        gltf,
        aoTexture,
        video,
        videoTexture,
        audio

    const [showInstructions, setShowInstructions] = createSignal(true)
    const [spawned, setSpawned] = createSignal(false)
    const [barrieraTypeSelected, setBarrieraTypeSelected] = createSignal(
        BARRRIERA_TYPE.STANDARD
    )
    const [scale, setScale] = createSignal(1)
    const [rotation, setRotation] = createSignal(0)

    const handleCloseInstructions = () => {
        setShowInstructions(false)
        handleReticle()
        handleBlurredCover()
    }

    const handleUndo = () => {
        game.onUndo() // audio

        if (audio) audio.stop()
        // robotGlb.resetAnimations()
        game.removePreviousFromScene()
        setSpawned(false)
        handleReticle()
    }

    const handleChangeSize = (newSize) => {
        console.log("newSize:", newSize)
        setScale(newSize)
        setModelScale()
    }

    const handleChangeRotation = (newRotation) => {
        console.log("newRotation:", newRotation)
        setRotation(newRotation)
        setModelRotation()
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

        onLowFps: () => {
            toggleVideo(false)
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
                    if (video) {
                        syncVideoToAnimation()
                    }
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
            if (audio) audio.stop()
        },
    })

    /*
     * On mount
     */
    onMount(async () => {
        group = new THREE.Group()

        props.setLoadingMessage("audio...")
        audio = await new LoadPositionalAudio(
            "models/demo/Rulliera/Rulliera_Audio.mp3",
            SceneManager.listener,
            {
                volume: 2 * scale(),
                loop: true,
            }
        )
       

        /*
         * CASSONI
         */
        props.setLoadingMessage("CASSONI...")
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
        props.setLoadingMessage("GROUND...")
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
         * BARRIERE STANDARD
         */
        props.setLoadingMessage("BARRIERE...")
        aoTexture = await loadTexture("models/demo/Rulliera/BARRIERA_AO.webp")
        aoTexture.flipY = true
        gltf = await loadGLTF(
            "models/demo/Rulliera/BARRIERE_001_compressed.glb"
        )
        BARRIERE_STANDARD = gltf.scene
        BARRIERE_STANDARD = RecreateMaterials(BARRIERE_STANDARD, {
            aoMap: aoTexture,
            aoMapChannel: 1,
            aoMapIntensity: 1,
        })
        group.add(BARRIERE_STANDARD)

        /*
         * BARRIERE_MICRON
         */
        gltf = await loadGLTF(
            "models/demo/Rulliera/BARRIERE_MICRON_002_compressed.glb"
        )
        BARRIERE_MICRON = gltf.scene
        group.add(BARRIERE_MICRON)

        /*
         * GREEN LIGHT ALLE BARRIERE
         */
        // green point light at center, 1m high
        LIGHT_GREEN = new THREE.PointLight(
            0x00ff00,
            lightsIntensity * scale() * scale(),
            4 * scale(),
            4
        )
        LIGHT_GREEN.position.set(-0.6, 0.8, 0)
        group.add(LIGHT_GREEN)

        /*
         * RED LIGHT ALLE BARRIERE
         */
        LIGHT_RED = new THREE.PointLight(
            0xf60d0d,
            lightsIntensity * scale() * scale(),
            4 * scale(),
            4
        )
        LIGHT_RED.position.set(-0.65, 1.4, 0)
        group.add(LIGHT_RED)

        /*
         * ANIM TENDE E RAGGI
         */
        props.setLoadingMessage("TENDE E RAGGI...")
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
        video.src = "models/demo/Rulliera/ANIM_RULLI_SCATOLE_LM_compressed.mp4"
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

    const UIContainer = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        box-sizing: border-box;
    `

    const SwapButtonsContainer = styled("div")`
        padding-top: 1.5rem;
        width: 90%;
        display: flex;
        gap: 1rem;
        /* align-items: center;
        justify-content: flex-end;
        box-sizing: border-box; */
    `

    const View = () => {
        return (
            <Show
                when={showInstructions()}
                fallback={
                    <>
                        {/* <Toolbar
                            id="toolbar"
                            buttons={["undo"]}
                            onUndo={handleUndo}
                            undoActive={spawned()}
                        /> */}

                        <Show when={spawned()}>
                            <UIContainer>
                                <HorizontalSlider
                                    label={"Scala"}
                                    min={"0.1"}
                                    max={"1"}
                                    default={1}
                                    step={"0.1"}
                                    onChange={(value) =>
                                        handleChangeSize(value)
                                    }
                                ></HorizontalSlider>

                                <HorizontalSlider
                                    label={"Rotazione"}
                                    min={"0"}
                                    max={"360"}
                                    default={0}
                                    step={"0.1"}
                                    onChange={(value) =>
                                        handleChangeRotation(value)
                                    }
                                    showValue={false}
                                ></HorizontalSlider>

                                <SwapButtonsContainer>
                                    <ToggleButton
                                        isOn={
                                            barrieraTypeSelected() ===
                                            BARRRIERA_TYPE.STANDARD
                                        }
                                        onClick={() =>
                                            swapBarriera(
                                                BARRRIERA_TYPE.STANDARD
                                            )
                                        }
                                    >
                                        Standard
                                    </ToggleButton>
                                    <ToggleButton
                                        isOn={
                                            barrieraTypeSelected() ===
                                            BARRRIERA_TYPE.MICRON
                                        }
                                        onClick={() =>
                                            swapBarriera(BARRRIERA_TYPE.MICRON)
                                        }
                                    >
                                        Micron
                                    </ToggleButton>
                                </SwapButtonsContainer>
                            </UIContainer>
                        </Show>
                    </>
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
                        piano. <br></br> Evita i piani troppo riflettenti o
                        uniformi.
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

    function spawnModel(matrix) {
        const position = new Vector3()
        position.setFromMatrixPosition(matrix)

        const rotation = new Euler()
        rotation.setFromRotationMatrix(matrix)

        group.position.copy(position)
        group.rotation.copy(rotation)

        game.addToScene(group)

        setModelScale()
        setModelRotation()

        //  // group.rotation.y = Math.PI / 2
        // // Apply rotation signal (degrees -> radians) on top of default 90°
        // group.rotation.y = Math.PI / 2 + THREE.MathUtils.degToRad(rotation())

        // // group.scale.set(globalScale, globalScale, globalScale)
        // group.scale.set(scale(), scale(), scale())

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

        swapBarriera(barrieraTypeSelected())

        group.add(audio)
        audio.play()
    }

    function swapBarriera(newType) {
        game.onClick()
        setBarrieraTypeSelected(newType)
        BARRIERE_STANDARD.traverse((child) => {
            if (child.isMesh) {
                if (barrieraTypeSelected() === BARRRIERA_TYPE.STANDARD) {
                    child.visible = true
                } else {
                    child.visible = false
                }
            }
        })
        BARRIERE_MICRON.traverse((child) => {
            if (child.isMesh) {
                if (barrieraTypeSelected() === BARRRIERA_TYPE.MICRON) {
                    child.visible = true
                } else {
                    child.visible = false
                }
            }
        })
    }

    function setModelScale() {
        group.scale.set(scale(), scale(), scale())

        LIGHT_GREEN.intensity = lightsIntensity * scale() * scale()
        LIGHT_GREEN.distance = 4 * scale()

        LIGHT_RED.intensity = lightsIntensity * scale() * scale()
        LIGHT_RED.distance = 4 * scale()

        audio.setVolume(2 * scale())
    }

    function setModelRotation() {
        group.rotation.y = Math.PI / 2 + THREE.MathUtils.degToRad(rotation())
    }

    function toggleVideo(value) {
        console.warn("imposto video:", value)
        if (!value && video) {
            try {
                // Pause and unload the HTMLVideoElement
                if (video) {
                    video.pause()
                    video.currentTime = 0
                    // Clear source and attempt to unload
                    try {
                        video.removeAttribute("src")
                        video.src = ""
                        video.load()
                    } catch (e) {
                        // ignore
                    }
                }

                // Dispose the Three.js VideoTexture
                if (videoTexture) {
                    videoTexture.dispose()
                    videoTexture = null
                }

                // Remove references to the video texture from meshes so GC can reclaim resources
                if (RULLI_SCATOLE) {
                    RULLI_SCATOLE.traverse((child) => {
                        if (child.isMesh && child.material) {
                            // Clear aoMap (where videoTexture was assigned) and mark material for update
                            if (child.material.aoMap)
                                child.material.aoMap = null
                            child.material.needsUpdate = true
                        }
                    })
                }

                // Null out the video reference to allow GC
                video = null
            } catch (err) {
                console.error(
                    "Error while stopping/clearing video resources:",
                    err
                )
            }
        }
    }
}
