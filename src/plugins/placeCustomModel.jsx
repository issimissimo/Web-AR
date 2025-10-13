import { onMount, createSignal, createEffect, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import SceneManager from "@js/sceneManager"
import Message from "@components/Message"
import { Vector3, Euler } from "three"
import { GLBFile } from "@tools/three/modelTools"
import { LoadTexture } from "@tools/three/textureTools"
import { LoadPositionalAudio } from "@tools/three/audioTools"
import { setMaterialsShadows } from "@tools/three/materialTools"
import ContactShadowsXR from "@tools/three/ContactShadowsXR"
import ClippingReveal from "@tools/three/ClippingReveal"
import Toolbar from "@views/ar-overlay/Toolbar"
import Button from "@components/Button"
import { useFirebase } from "@hooks/useFirebase"

const STATE = {
    FILE_LIST: "fileList",
    INSTRUCTIONS: "instructions",
    GAME: "game",
}

export default function placeCustomModel(props) {
    const firebase = useFirebase()
    const [state, setState] = createSignal(STATE.INSTRUCTIONS)
    const [loading, setLoading] = createSignal(false)
    const [spawned, setSpawned] = createSignal(false)
    const [hitMatrix, setHitMatrix] = createSignal(null)
    const [modelRotation, setModelRotation] = createSignal(0)

    let fileList = []

    let shadows, clippingReveal, model

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("placeCustomModel", props.id, {
        onTap: () => {
            if (state() === STATE.GAME && Reticle.visible() && Reticle.isHitting() && !spawned()) {
                console.log("TAPPPPPP")
                game.super.onTap() // audio
                // const hitMatrix = Reticle.getHitMatrix()
                setHitMatrix(Reticle.getHitMatrix())
                spawnModel()
                handleReticle()
            }
        },

        renderLoop: () => {
            if (shadows) shadows.update()
            if (clippingReveal) clippingReveal.update()
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
        // load the list of
        // the available models
        if (game.appMode === "save") {
            const path = `users/${game.userId}/uploads`
            fileList = await firebase.storage.listFiles(path)
        }

        // load data
        await game.loadGameData()

        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            if (game.appMode === "save") {
                setState(STATE.FILE_LIST)
            }
            if (game.appMode === "load") {
                console.warn("Non è stato impostato nessun modello qui!")
            }
        } else {
            // load the saved model
            const data = game.gameData()
            await loadModel(data.filePath)
        }

        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()
    })

    /*
     * REAL TIME
     */
    const { data } = firebase.realtimeDb.useRealtimeData(game.realtimeDbPath)
    createEffect(
        on(data, (newData) => {
            // Fai quello che vuoi con i nuovi dati
            if (props.enabled) {
                console.log("||||||||||||||||||||||||||||||||||||||||")
                console.log("Dati aggiornati in realtime:", newData)
                console.log("||||||||||||||||||||||||||||||||||||||||")

                loadModel(newData.filePath)
            }
        })
    )

    const handleCloseInstructions = () => {
        setState(STATE.GAME)
    }

    const clearScene = () => {
        if (shadows) shadows.dispose()
        if (clippingReveal) clippingReveal.dispose()
        shadows = null
        clippingReveal = null
        game.removePreviousFromScene()
    }

    const handleUndo = () => {
        game.onUndo() // audio
        clearScene()
        // model.resetAnimations()
        // game.removePreviousFromScene()
        setHitMatrix(null)
        setSpawned(false)
        handleReticle()
    }

    const handleSaveData = (file) => {
        const newData = {
            fileName: file.name,
            filePath: file.fullPath,
            rotation: modelRotation(),
        }
        game.setGameData(newData)
        game.saveGameData()
    }

    const loadModel = async (path) => {
        setLoading(true)

        if (game.appMode === "save") {
            setState(STATE.GAME)
        }
        // let blobUrl = null

        try {
            // const blob = await firebase.storage.getFileBlob(path)
            // blobUrl = URL.createObjectURL(blob)

            const fileUrl = await firebase.storage.getFileURL(path)

            const glbFile = await new GLBFile(fileUrl)
            model = glbFile.model
            // console.log(model)

            // URL.revokeObjectURL(blobUrl)

            setLoading(false)

            // if we already have picked
            // replace the spawned model
            if (hitMatrix()) {
                clearScene()

                setTimeout(() => {
                    spawnModel()
                }, 200)
            }
        } catch (error) {
            console.error("Errore:", error)
            // if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }

    //region RETICLE AND BLURRED COVER

    const handleReticle = () => {
        if (state() === STATE.GAME && !spawned()) {
            Reticle.setup(Reticle.MESH_TYPE.RINGS, {
                size: 0.4,
                ringNumber: 4,
                ringThickness: 0.2,
                color: 0xf472b6,
            })
            Reticle.setSurfType(Reticle.SURF_TYPE_MODE.FLOOR)
            Reticle.setVisible(true)
        } else {
            Reticle.setEnabled(false)
        }
    }

    const handleBlurredCover = () => {
        if (state() === STATE.INSTRUCTIONS) {
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

    createEffect(
        on(state, (currentState) => {
            handleReticle()
            handleBlurredCover()
        })
    )

    function spawnModel() {
        const position = new Vector3()
        position.setFromMatrixPosition(hitMatrix())

        console.log(position)

        const rotation = new Euler()
        rotation.setFromRotationMatrix(hitMatrix())

        model.position.copy(position)
        model.rotation.copy(rotation)
        model.rotateY(Math.PI / 2)
        setMaterialsShadows(model, true)
        game.addToScene(model)

        setSpawned(true)

        handleReticle()

        console.log(model)

        shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer, {
            position: position,
            resolution: 512,
            blur: 2,
            animate: true,
            updateFrequency: 2,
        })

        clippingReveal = new ClippingReveal(model, SceneManager.renderer, {
            ringsRadius: 0.2,
            ringNumber: 4,
            ringThickness: 0.2,
            ringsColor: 0xf472b6,
            duration: 2.0,
            autoStart: true,
            startDelay: 200,
            fadeOutDuration: 2,
        })
    }

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

    const Instructions = () => {
        return (
            <Message
                style={{ height: "auto" }}
                svgIcon={"icons/tap.svg"}
                showDoneButton={true}
                onDone={handleCloseInstructions}
            >
                Fai TAP sullo schermo per posizionare il robot Comau RACER 3 su un piano. <br></br>{" "}
                Evita i piani troppo riflettenti o uniformi.
            </Message>
        )
    }

    const FileList = () => {
        return (
            <>
                {fileList?.map((file) => (
                    <Button onClick={() => handleSaveData(file)}>{file.name}</Button>
                ))}
            </>
        )
    }

    const View = () => {
        return (
            <>
                <Show when={state() === STATE.INSTRUCTIONS}>
                    <Container>
                        <Instructions />
                    </Container>
                </Show>

                <Show when={state() === STATE.FILE_LIST}>
                    <Container>
                        <FileList />
                    </Container>
                </Show>

                <Show when={state() === STATE.GAME}>
                    {loading() && <p>loading...</p>}
                    <Toolbar
                        buttons={["undo", "list"]}
                        onUndo={handleUndo}
                        undoActive={spawned()}
                        onList={setState(STATE.FILE_LIST)}
                        highlightList={state() !== STATE.FILE_LIST}
                    />
                </Show>
            </>
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
}
