import { onMount, createSignal, createEffect, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import Message from "@components/Message"
import { Vector3, Euler } from "three"
import { GLBFile } from "@tools/three/modelTools"
import { LoadTexture } from "@tools/three/textureTools"
import Toolbar from "@views/ar-overlay/Toolbar"

export default function demoFinder(props) {
    const [showInstructions, setShowInstructions] = createSignal(true)
    const [spawned, setSpawned] = createSignal(false)

    let loadedModel

    const handleCloseInstructions = () => {
        setShowInstructions(false);
        handleReticle();
        handleBlurredCover();
    }

    const handleUndo = () => {
        game.onUndo() // audio
        game.removePreviousFromScene();
        setSpawned(false);
        handleReticle();
    }

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("demoFinder", props.id, {
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
                handleReticle();
            }
        },

        renderLoop: () => {
        },

        close: () => {
        },
    })

    /*
     * On mount
     */
    onMount(async () => {

        const aoTexture = await new LoadTexture(
            "models/demo/Finder/4box_USBP_503_su_muro.jpg",
            {
                flipY: false,
            }
        )

        const glb = await new GLBFile(
            "models/demo/Finder/4box_USBP_503_su_muro.glb",
            {
                aoMap: aoTexture,
                aoMapIntensity: 1,
            }
        )

        loadedModel = glb.model


        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()
    })



    //region RETICLE AND BLURRED COVER

    const handleReticle = () => {
        if (showInstructions() || spawned()) {
            Reticle.setEnabled(false);
        }
        else {
            Reticle.setup(Reticle.MESH_TYPE.RINGS, {
                size: 0.4,
                ringNumber: 4,
                ringThickness: 0.2,
                color: 0xf472b6,
            });
            Reticle.setSurfType(Reticle.SURF_TYPE_MODE.WALL)
            Reticle.setVisible(true)
        }
    };

    const handleBlurredCover = () => {
        if (showInstructions()) {
            game.handleBlurredCover({
                visible: true,
                showHole: false,
                priority: 9999,
            })
        }
        else {
            game.handleBlurredCover({
                visible: false,
            })
        }
    };

    createEffect(
        on(
            () => [props.enabled, props.selected],
            ([enabled, selected]) => {
                if (
                    (game.appMode === "load" &&
                        enabled && game.gameDetails.interactable) ||
                    (game.appMode === "save" && selected)
                ) {
                    console.log("++++++++++++++++++++++ >>> handleBlurredCover")
                    handleReticle();
                    handleBlurredCover();
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
                        Fai TAP su una parete per posizionare la presa Finder. <br></br> Evita pareti riflettenti o molto uniformi.
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

    function spawnModel(matrix) {
        const position = new Vector3()
        position.setFromMatrixPosition(matrix)

        const rotation = new Euler()
        rotation.setFromRotationMatrix(matrix)

        loadedModel.position.copy(position)
        loadedModel.rotation.copy(rotation)
        loadedModel.rotateX(Math.PI / -2)
        // loadedModel.rotateY(Math.PI / 2)
       
        game.addToScene(loadedModel)

        setSpawned(true)
    }
}
