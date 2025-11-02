import { onMount, createSignal, createEffect, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import SceneManager from "@js/sceneManager"
import Message from "@components/Message"
import { Vector3, Euler } from "three"
import { GLBFile } from "@tools/three/modelTools"
import { LoadTexture } from "@tools/three/textureTools"
import { setMaterialsShadows } from "@tools/three/materialTools"
import ContactShadowsXR from "@tools/three/ContactShadowsXR"
import ClippingReveal from "@tools/three/ClippingReveal"
import Toolbar from "@views/ar-overlay/Toolbar"
import Button from "@components/Button"
import ButtonCircle from "@components/ButtonCircle"
import { useFirebase } from "@hooks/useFirebase"
import Fa from "solid-fa"
import { faListUl } from "@fortawesome/free-solid-svg-icons"
import { findUserDataKey, getAllMaterials } from "@tools/three/modelTools"

export default function placeCustomModel(props) {
    const firebase = useFirebase()
    const [spawned, setSpawned] = createSignal(false)
    const [hitMatrix, setHitMatrix] = createSignal(null)

    const [customVariants, setCustomVariants] = createSignal(null)

    const [selectedFileName, setSelectedFileName] = createSignal(null)
    const [loadingFileName, setLoadingFileName] = createSignal(null)
    const [showFileList, setShowFileList] = createSignal(false)
    const [showInstructions, setShowInstructions] = createSignal(false)

    const defaultFolder = "models/demo/default/"

    let fileList
    let shadows, clippingReveal, model

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("placeCustomModel", props.id, {
        onTap: () => {
            if (props.selected || game.appMode === "load") {
                if (Reticle.visible() && Reticle.isHitting()) {
                    setHitMatrix(Reticle.getHitMatrix())
                    spawnModel()
                }
            }
        },

        renderLoop: () => {
            if (shadows) shadows.update()
            if (clippingReveal) clippingReveal.update()
        },

        close: () => {
            if (shadows) shadows.dispose()
            if (clippingReveal) clippingReveal.dispose()
        },
    })

    async function fetchFileList(fileExtension) {
        // get default files
        const defaultFileList = await listFiles(defaultFolder + "list.json")

        // get remote files
        const path = `users/${game.userId}/uploads`
        let remoteFileList = await firebase.storage.listFiles(path)

        remoteFileList = remoteFileList.filter(
            (file) => file.name && file.name.endsWith(fileExtension)
        )

        // create list
        const list = [
            ...defaultFileList.map((fileName) => ({
                fileName,
                filePath: defaultFolder + fileName,
                type: "default",
            })),
            ...remoteFileList.map((file) => ({
                fileName: file.name,
                filePath: file.fullPath,
                type: "remote",
            })),
        ]

        console.log("+++++++++++++++ list:", list)

        return list
    }

    async function fileExists(url) {
        try {
            const response = await fetch(url, { method: "HEAD" })
            return response.ok // true se esiste, false se 404 o altro
        } catch (error) {
            return false // es. rete non raggiungibile
        }
    }

    /*
     * On mount
     */
    onMount(async () => {
        // load the list of all available models
        fileList = await fetchFileList(".glb")

        // load data
        await game.loadGameData()

        // if we have don't have any data saved,
        // load the 1st model of the list
        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> CARICO IL MODELLO DI DEFAULT!!!")
            await loadModel(fileList[0])
        } else {
            // load the saved model
            console.log(">>>>>>>>>>>>> CARICO IL MODELLO SALVATO!!!")
            await loadModel(game.gameData())
        }

        /////////////////////////////////////////////////////////

        if (game.appMode === "load") {
            setShowInstructions(true)
        }

        // // load data
        // await game.loadGameData()

        // if (!game.gameData()) {
        //     console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
        //     if (game.appMode === "save") {
        //         setShowFileList(true)
        //     }
        //     if (game.appMode === "load") {
        //         console.warn("Non è stato impostato nessun modello qui!")
        //     }
        // } else {
        //     // load the saved model
        //     const data = game.gameData()
        //     await loadModel(data)
        // }

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
                loadModel(newData)
            }
        })
    )

    const handleCloseInstructions = () => {
        setShowInstructions(false)
        handleBlurredCover()
        handleReticle()
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
        setHitMatrix(null)
        setSpawned(false)
        handleReticle()
    }

    const handleSaveData = (file) => {
        const newData = {
            fileName: file.name,
            filePath: file.fullPath,
        }
        game.setGameData(newData)
        game.saveGameData()
    }

    const loadModel = async (data) => {
        setLoadingFileName(data.fileName)

        try {
            //
            // get file url
            //
            let fileUrl
            if (data.type === "default") {
                fileUrl = data.filePath
            }
            if (data.type === "remote") {
                fileUrl = await firebase.storage.getFileURL(data.filePath)
            }

            console.log("...now loading from", fileUrl)

            //
            // check and load ambient occlusion texture
            //
            const aoPath =
                data.filePath.substring(0, data.filePath.lastIndexOf(".")) +
                "_ao.webp"
            
            let aoTexture = null
            let aoTextureUrl = null

            if (data.type === "default") {
                if (await fileExists(aoPath)) {
                    aoTextureUrl = aoPath
                }
            }

            if (data.type === "remote") {
                if (await firebase.storage.fileExists(aoPath)) {
                    aoTextureUrl = await firebase.storage.getFileURL(aoPath)
                }
            }

            if (aoTextureUrl) {
                aoTexture = await new LoadTexture(aoTextureUrl, {
                    flipY: true,
                })
                console.log("✅ Texture AO caricata!")
            } else {
                console.log("ℹ️ Texture AO non presente per questo modello")
            }

            //
            // load GLTF
            //
            const glbFile = await new GLBFile(fileUrl, {
                aoMap: aoTexture,
                aoMapChannel: 2,
            })
            model = glbFile.model
            // setLoading(false)
            setSelectedFileName(data.fileName)
            setLoadingFileName(null)
            setShowFileList(false)

            //
            // load user data for custom_variants
            // that are created in Blender
            //
            const variants = findUserDataKey(model, "custom_variants")
            if (variants) {
                const jsonString = variants.value
                const data = JSON.parse(jsonString)
                const presets = data.presets
                console.log("PRESETS:", presets)
                console.log("✅ Questo modello ha delle varianti!")
                console.log("Preset di default:", data.defaultPreset)

                // load all materials
                const materials = getAllMaterials(glbFile.gltf)
                if (materials) {
                    console.log("materiali:", materials)

                    //TODO: apply preset (if exist)


                }

            } else {
                console.log("ℹ️ Questo modello non ha delle varianti!")
            }

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
        }
    }

    //region  FUNCTIONS

    function applyMaterialsPreset(){
        
    }


    async function listFiles(folderUrl) {
        const res = await fetch(folderUrl)
        if (!res.ok) throw new Error("Errore nel caricamento dei file")
        return await res.json() // array di nomi file
    }

    function spawnModel() {
        game.super.onTap() // audio

        const position = new Vector3()
        position.setFromMatrixPosition(hitMatrix())
        const rotation = new Euler()
        rotation.setFromRotationMatrix(hitMatrix())

        model.position.copy(position)
        model.rotation.copy(rotation)
        model.rotateY(Math.PI / 2)
        setMaterialsShadows(model, true)
        game.addToScene(model)

        shadows = new ContactShadowsXR(
            SceneManager.scene,
            SceneManager.renderer,
            {
                position: position,
                resolution: 512,
                blur: 2,
                animate: false,
                updateFrequency: 2,
            }
        )

        clippingReveal = new ClippingReveal(model, SceneManager.renderer, {
            ringsRadius: 0.2,
            ringNumber: 4,
            ringThickness: 0.2,
            ringsColor: 0xf472b6,
            duration: 2.0,
            autoStart: true,
            startDelay: 200,
            fadeOutDuration: 1,
        })

        setSpawned(true)
        handleReticle()
    }

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

    // const Container = styled("div")`
    //     width: 100%;
    //     height: 100%;
    //     display: flex;
    //     flex-direction: column;
    //     align-items: center;
    //     justify-content: center;
    //     box-sizing: border-box;
    // `

    const Instructions = () => {
        return (
            <Message
                style={{ height: "auto" }}
                svgIcon={"icons/tap.svg"}
                showDoneButton={true}
                onDone={handleCloseInstructions}
            >
                Fai TAP sullo schermo per posizionare il modello 3D su un piano.{" "}
                <br></br> Evita i piani troppo riflettenti o uniformi.
            </Message>
        )
    }

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    `

    const InstructionsContainer = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `

    const SliderContainer = styled("div")`
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 1rem;
    `

    const ItemListContainer = styled("div")`
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        gap: 1rem;
        min-height: 40px;
        padding-bottom: 3px;
        padding-top: 3px;
    `

    const FileItemContainer = styled("div")`
        flex: 1;
        width: 100%;
        /* display: flex;
        align-items: center;
        box-sizing: border-box;
        box-sizing: border-box; */
        text-align: center;
        padding: 0.3rem;
        border-radius: 20px;
        background: var(--color-dark-transparent);
        box-sizing: border-box;
    `

    const FilePicker = () => {
        return (
            <ItemListContainer id="ItemListContainer">
                <Show when={showFileList()}>
                    <ItemListContainer id="ItemListContainer">
                        {fileList
                            ?.filter(
                                (file) => file.fileName !== selectedFileName()
                            )
                            .map((file) => (
                                <FileItemContainer
                                    onClick={() => handleSaveData(file)}
                                >
                                    {loadingFileName() === file.fileName
                                        ? "caricamento..."
                                        : file.fileName}
                                </FileItemContainer>
                            ))}
                    </ItemListContainer>
                </Show>
                <FileItemContainer id="FileItemContainer" class="glass">
                    {selectedFileName()}
                </FileItemContainer>
            </ItemListContainer>
        )
    }

    const View = () => {
        return (
            <>
                <Show when={game.appMode === "save"}>
                    <Container>
                        <SliderContainer data-interactive>
                            <FilePicker />
                            <ButtonCircle
                                onClick={setShowFileList(!showFileList())}
                                border={false}
                                theme={"dark"}
                            >
                                <Fa icon={faListUl} size="1x" class="icon" />
                            </ButtonCircle>
                        </SliderContainer>
                    </Container>
                </Show>

                <Show when={showInstructions()}>
                    <InstructionsContainer>
                        <Instructions />
                    </InstructionsContainer>
                </Show>

                <Show when={!showInstructions() && !showFileList()}>
                    <Toolbar
                        buttons={["undo"]}
                        onUndo={handleUndo}
                        undoActive={spawned()}
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
