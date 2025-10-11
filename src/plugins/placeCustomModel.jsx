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

export default function placeCustomModel(props) {
    const { storage, auth } = useFirebase()
    const [showInstructions, setShowInstructions] = createSignal(true)
    // const [modelLoaded, setModelLoaded] = createSignal(false)
    const [spawned, setSpawned] = createSignal(false)
    const [selectedFile, setSelectedFile] = createSignal(null)

    let shadows, clippingReveal, model, uploadUrl

    const handleCloseInstructions = () => {
        setShowInstructions(false)
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
            if (Reticle.visible() && Reticle.isHitting() && !showInstructions() && !spawned()) {
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
        // robotGlb = await new GLBFile(
        //     "models/demo/Comau_RACER3/Comau_RACER3.glb",
        //     {
        //         aoMap: aoTexture,
        //         aoMapIntensity: 1.4,
        //     }
        // )

        // loadedModel = robotGlb.model

        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()
    })

    // const handleFileSelect = (event) => {
    //     const file = event.target.files[0]
    //     if (file) {
    //         setSelectedFile(file)
    //         setUploadedURL(null)
    //         setError(null)
    //         console.log(
    //             "File selezionato:",
    //             file.name,
    //             "Dimensione:",
    //             file.size,
    //             "Tipo:",
    //             file.type
    //         )
    //     }
    // }

    const loadModel = async (url) => {
        const glbFile = await new GLBFile(url)
        model = glbFile.model
        handleCloseInstructions();
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onload = function (e) {
                const url = URL.createObjectURL(file)
                console.log(url)
                loadModel(url)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleUploadFile = async () => {
        const file = selectedFile()
        if (!file) {
            console.error("Nessun file selezionato")
            return
        }

        const user = auth.user()
        if (!user) {
            console.error("Utente non autenticato")
            return
        }

        // setUploading(true)
        // setError(null)
        // setProgress(0)

        try {
            // Crea un percorso unico usando timestamp
            const timestamp = Date.now()
            const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_") // Sanitizza il nome
            const path = `users/${user.uid}/uploads/${timestamp}_${fileName}`

            console.log("Inizio upload su percorso:", path)

            // Upload con monitoraggio progresso
            uploadUrl = await storage.uploadFileWithProgress(
                path,
                file,
                (prog) => {
                    // setProgress(Math.round(prog))
                    console.log(`Progresso upload: ${Math.round(prog)}%`)
                },
                {
                    contentType: file.type,
                    customMetadata: {
                        uploadedBy: user.uid,
                        uploadedAt: new Date().toISOString(),
                        originalName: file.name,
                    },
                }
            )

            // setUploadedURL(url)
            console.log("Upload completato! URL:", uploadUrl)
        } catch (err) {
            console.error("Errore durante l'upload:", err)
            // setError(err.message || "Errore durante l'upload")
        } finally {
            // setUploading(false)

            game.setGameData({
                fileUrl: uploadUrl
            })

            game.saveGameData()
        }
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

    const View = () => {
        return (
            <Show
                when={showInstructions()}
                fallback={
                    <Toolbar
                        id="toolbar"
                        buttons={["undo", "save"]}
                        onUndo={handleUndo}
                        undoActive={spawned()}
                        onSave={handleUploadFile}
                        saveActive={selectedFile()}
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
                        Fai TAP sullo schermo per posizionare il robot Comau RACER 3 su un piano.{" "}
                        <br></br> Evita i piani troppo riflettenti o uniformi.
                    </Message>
                    {/* <Button onClick={handleFileSelect}>
                        Carica modello
                    </Button> */}
                    <label
                        style={{
                            display: "block",
                            padding: "15px",
                            "background-color": "#4CAF50",
                            color: "white",
                            "text-align": "center",
                            "border-radius": "8px",
                            cursor: "pointer",
                            "font-weight": "bold",
                        }}
                    >
                        {selectedFile() ? "📄 " + selectedFile().name : "📁 Seleziona File"}
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            accept=".glb, .gltf, .GLB, .GLTF"
                        />
                    </label>
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
}
