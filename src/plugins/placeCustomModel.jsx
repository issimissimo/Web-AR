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
    const { storage, auth } = useFirebase()
    const [state, setState] = createSignal(STATE.INSTRUCTIONS)
    // const [showInstructions, setShowInstructions] = createSignal(false)
    // const [modelLoaded, setModelLoaded] = createSignal(false)
    const [spawned, setSpawned] = createSignal(false)

    const [listVisible, setListVisible] = createSignal(false)

    let fileList = []

    let shadows, clippingReveal, model, uploadUrl

    // const user = auth.user();
    // console.log("USER:", user)
    // const path = `users/${user.uid}/uploads`

    const handleCloseInstructions = () => {
        setState(STATE.GAME)
        handleReticle()
        handleBlurredCover()
    }

    const handleUndo = () => {
        // game.onUndo() // audio
        // if (shadows) shadows.dispose()
        // if (audioRobot) audioRobot.stop()
        // if (clippingReveal) clippingReveal.dispose()
        // model.resetAnimations()
        // game.removePreviousFromScene()
        // setSpawned(false)
        // handleReticle()
    }

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("placeCustomModel", props.id, {
        onTap: () => {
            if (state() === STATE.GAME && Reticle.visible() && Reticle.isHitting() && !spawned()) {
                game.super.onTap() // audio
                const hitMatrix = Reticle.getHitMatrix()
                spawnModel(hitMatrix)
                // handleReticle();
            }
        },

        renderLoop: () => {
            if (props.enabled && spawned()) {
                // robotGlb.animate()
                // if (shadows) shadows.update()
                // if (clippingReveal) clippingReveal.update()
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
        // load data
        await game.loadGameData()

        // set default data if no data are saved
        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            if (game.appMode === "save") {
                setState(STATE.FILE_LIST)
            }
        } else {
            const data = game.gameData()
            console.log("DATA:", data)
            console.log(">>>>>>>>>>>>> CARICO:", data.fileUrl)
            // const glbFile = await new GLBFile(data.fileUrl)
            // model = glbFile.model
            // if (game.appMode === "save") {
            //     setState(STATE.GAME)
            // }
        }

        // load file list
        if (game.appMode === "save") {
            const user = firebase.auth.user()
            const path = `users/${user.uid}/uploads`
            fileList = await firebase.storage.listFiles(path)
            console.log(fileList)
        }

        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()
    })

    const loadModel = async (url) => {
        const glbFile = await new GLBFile(url)
        model = glbFile.model
        handleCloseInstructions()
    }

    //region RETICLE AND BLURRED COVER

    const handleReticle = () => {
        if (state() === STATE.GAME || spawned()) {
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

    function spawnModel(matrix) {
        const position = new Vector3()
        position.setFromMatrixPosition(matrix)

        const rotation = new Euler()
        rotation.setFromRotationMatrix(matrix)

        model.position.copy(position)
        model.rotation.copy(rotation)
        model.rotateY(Math.PI / 2)
        setMaterialsShadows(model, true)
        game.addToScene(model)

        setSpawned(true)

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
            onComplete: () => console.log("Reveal completed"),
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
                    <Button
                    // fileName={file.name}
                    // filePath={path + "/" + file.name}
                    // onFileDeleted={refreshFileList()}
                    >
                        {file.name}
                    </Button>
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
                    <Toolbar
                        buttons={["undo", "save"]}
                        onUndo={handleUndo}
                        undoActive={spawned()}
                        onSave={handleUploadFile}
                        saveActive={selectedFile()}
                    />
                </Show>
            </>
        )
    }

    // const View = () => {
    //     return (
    //         <Show
    //             when={showInstructions()}
    //             fallback={
    //                 <Toolbar
    //                     id="toolbar"
    //                     buttons={["undo", "save"]}
    //                     onUndo={handleUndo}
    //                     undoActive={spawned()}
    //                     onSave={handleUploadFile}
    //                     saveActive={selectedFile()}
    //                 />
    //             }
    //         >
    //             <Container>
    //                 <Message
    //                     style={{ height: "auto" }}
    //                     svgIcon={"icons/tap.svg"}
    //                     showDoneButton={true}
    //                     onDone={handleCloseInstructions}
    //                 >
    //                     Fai TAP sullo schermo per posizionare il robot Comau RACER 3 su un piano.{" "}
    //                     <br></br> Evita i piani troppo riflettenti o uniformi.
    //                 </Message>
    //             </Container>
    //         </Show>
    //     )
    // }

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
