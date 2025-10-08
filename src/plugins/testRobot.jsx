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

export default function testRobot(props) {
    const [showInstructions, setShowInstructions] = createSignal(true)
    const [spawned, setSpawned] = createSignal(false)

    let loadedModel, shadows, audioRobot, clippingReveal, robotGlb

    const handleCloseInstructions = () => {
        setShowInstructions(false);
        handleReticle();
        handleBlurredCover();
    }

    const handleUndo = () => {
        game.onUndo() // audio

        if (shadows) shadows.dispose()
        if (audioRobot) audioRobot.stop()
        if (clippingReveal) clippingReveal.dispose()
        // Reticle.setEnabled(true)
        robotGlb.resetAnimations();

        game.removePreviousFromScene();
        setSpawned(false);
        handleReticle();
    }

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("testRobot", props.id, {
        onTap: () => {
            if (
                Reticle.visible() &&
                Reticle.isHitting() &&
                !showInstructions() &&
                !spawned()
            ) {
                // Tap sound
                game.super.onTap()

                const hitMatrix = Reticle.getHitMatrix()
                spawnModel(hitMatrix)
                setSpawned(true)

                // Reticle.setEnabled(false)
                handleReticle();
            }
        },

        renderLoop: () => {
            if (props.enabled && spawned()) {
                robotGlb.animate()

                if (shadows) shadows.update()
                if (clippingReveal) clippingReveal.update()
            }
        },

        close: () => {
            if (shadows) shadows.dispose()
            if (audioRobot) audioRobot.stop()
        },
    })

    /*
     * On mount
     */
    onMount(async () => {
        // Reticle.set(Reticle.MESH_TYPE.RINGS);

        // Reticle.setVisible(false)

        const aoTexture = await new LoadTexture(
            "models/demo/Comau_RACER3/Comau_RACER3.jpg",
            {
                flipY: false,
            }
        )

        robotGlb = await new GLBFile(
            "models/demo/Comau_RACER3/Comau_RACER3.glb",
            {
                aoMap: aoTexture,
                aoMapIntensity: 1.4,
            }
        )

        loadedModel = robotGlb.model

        audioRobot = await new LoadPositionalAudio(
            "models/demo/Comau_RACER3/Comau_RACER3.ogg",
            SceneManager.listener,
            {
                volume: 2,
                loop: true,
            }
        )

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
            console.log("STO ABILITANDO RETICLE....")
            Reticle.setup(Reticle.MESH_TYPE.RINGS, {
                size: 0.4,
                ringNumber: 4,
                ringThickness: 0.2,
                color: 0xf472b6,
            });
            Reticle.setSurfType(Reticle.SURF_TYPE_MODE.FLOOR)
            Reticle.setVisible(true)
        }
    };

    const handleBlurredCover = () => {
        if (showInstructions()) {
            game.handleBlurredCover({
                visible: true,
                showHole: false,
                priority: 999,
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
                    console.log("ADESSO DEVO SETTARE RETICLE PER ROBOT")
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
        /* padding: 2em; */
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
                        Fai TAP sullo schermo per posizionare il robot Comau
                        RACER 3 su un piano. <br></br> Evita i piani troppo
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

    function spawnModel(matrix) {
        const position = new Vector3()
        position.setFromMatrixPosition(matrix)

        const rotation = new Euler()
        rotation.setFromRotationMatrix(matrix)

        loadedModel.position.copy(position)
        loadedModel.rotation.copy(rotation)
        loadedModel.rotateY(Math.PI / 2)
        setMaterialsShadows(loadedModel, true)
        game.addToScene(loadedModel)

        loadedModel.add(audioRobot)
        audioRobot.play()

        setSpawned(true)

        shadows = new ContactShadowsXR(
            SceneManager.scene,
            SceneManager.renderer,
            {
                position: position,
                resolution: 512,
                blur: 2,
                animate: true,
                updateFrequency: 2,
            }
        )

        clippingReveal = new ClippingReveal(
            loadedModel,
            SceneManager.renderer,
            {
                ringsRadius: 0.2,
                ringNumber: 4,
                ringThickness: 0.2,
                ringsColor: 0xf472b6,
                duration: 2.0,
                autoStart: true,
                startDelay: 200,
                fadeOutDuration: 2,
                onComplete: () => console.log("Reveal completed"),
            }
        )
    }
}
