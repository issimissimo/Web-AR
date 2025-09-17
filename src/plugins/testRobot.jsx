import { onMount, createSignal, createEffect } from 'solid-js';
import { styled } from 'solid-styled-components';

import { useGame } from '@js/gameBase';
import Reticle from '@js/reticle';
import SceneManager from '@js/sceneManager';

import Message from '@components/Message';
import ButtonCircle from '@components/ButtonCircle';
import SvgIcon from '@components/SvgIcon';

import { Vector3, Euler } from "three";
import { LoadTexture } from '@tools/three/textureTools';
import { LoadPositionalAudio } from '@tools/three/audioTools';
import { RecreateMaterials, setMaterialsShadows } from '@tools/three/materialTools';
import ContactShadowsXR from '@tools/three/ContactShadowsXR';
import ClippingReveal from '@tools/three/ClippingReveal';



export default function testRobot(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);
    const [spawned, setSpawned] = createSignal(false);

    let loadedModel,
        shadows,
        audioRobot,
        clippingReveal
    // audioReveal


    const handleCloseInstructions = () => {
        setShowInstructions(() => false);
        Reticle.setVisible(true);
        // game.blurBackground(false);
        game.handleBlurredCover({ visible: false });
        game.forceUpdateDomElements();
    }


    const handleUndo = () => {

        // super
        game.onUndo();

        if (shadows) shadows.dispose();
        if (audioRobot) audioRobot.stop();
        if (clippingReveal) clippingReveal.dispose();
        Reticle.setEnabled(true);
        game.loader.resetAnimations();
        game.removePreviousFromScene();
        setSpawned(false);
    }



    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("testRobot", props.id, {

        onTap: () => {

            if (Reticle.visible() && Reticle.isHitting() && !showInstructions()) {

                // Tap sound
                game.super.onTap();

                const hitMatrix = Reticle.getHitMatrix();
                spawnModel(hitMatrix);
                setSpawned(true);

                Reticle.setEnabled(false);
            }
        },


        renderLoop: () => {
            if (game.loader.loaded() && spawned()) {

                game.loader.animate();
                if (shadows) shadows.update();
                if (clippingReveal) clippingReveal.update();
            }
        },


        close: () => {
            if (shadows) shadows.dispose();
            if (audioRobot) audioRobot.stop();
        },


    });


    /*
    * DATA
    */



    /*
    * On mount
    */
    onMount(async () => {

        // Reticle.set(Reticle.MESH_TYPE.RINGS);

        Reticle.setVisible(false);


        const aoTexture = await new LoadTexture("models/demo/Comau_RACER3/Comau_RACER3.jpg",
            {
                flipY: false
            });


        loadedModel = await game.loader.load("models/demo/Comau_RACER3/Comau_RACER3.glb");
        loadedModel = RecreateMaterials(loadedModel,
            {
                aoMap: aoTexture,
                aoMapIntensity: 1.4
            });


        audioRobot = await new LoadPositionalAudio("models/demo/Comau_RACER3/Comau_RACER3.ogg", SceneManager.listener,
            {
                volume: 2,
                loop: true
            });


        // audioReveal = await new LoadPositionalAudio("sounds/reveal.ogg", SceneManager.listener);


        // blur background for instructions
        // game.blurBackground(true);
        game.handleBlurredCover({ visible: true });

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)

    });



    createEffect(async () => {
        if (props.enabled) {
            console.log("***** testRobot is enabled *****")
            // Reticle.setDetectionMode(1); // only floor
            Reticle.setSurfType(Reticle.SURF_TYPE_MODE.FLOOR);
        }
    })




    /*
    * STYLE
    */
    const Container = styled('div')`
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2em;
    `

    const ContainerToolbar = styled('div')`
        position: absolute;
        right:1.5em;
        top:20%;
        height: 50vh;
        display: flex;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    `


    const Toolbar = () => {
        return (
            <ContainerToolbar>
                <ButtonCircle data-interactive
                    active={spawned()}
                    visible={true}
                    border={false}
                    onClick={handleUndo}
                >
                    <SvgIcon src={"icons/undo.svg"} size={18} />
                </ButtonCircle>
            </ContainerToolbar>
        )
    }


    /*
    * RENDER (Will be shown ONLY after initialization completed)
    */
    return (
        <>
            {
                props.enabled && (
                    showInstructions() ?

                        <Container>
                            <Message
                                style={{ "height": "auto" }}
                                svgIcon={'icons/tap.svg'}
                                showReadMore={false}
                                showDoneButton={true}
                                onDone={handleCloseInstructions}
                            >
                                Fai TAP sullo schermo per posizionare il robot Comau RACER 3 su un piano. <br></br> Evita i piani troppo riflettenti o uniformi.
                            </Message>
                        </Container>

                        :

                        <Toolbar />

                )
            }
        </>
    );


    //#region [functions]


    function spawnModel(matrix) {
        // spawnedModel = game.loader.clone();
        // spawnedModel = game.loader.model;

        const position = new Vector3();
        position.setFromMatrixPosition(matrix);

        const rotation = new Euler();
        rotation.setFromRotationMatrix(matrix);

        loadedModel.position.copy(position);
        loadedModel.rotation.copy(rotation);
        loadedModel.rotateY(Math.PI / 2);
        setMaterialsShadows(loadedModel, true)
        game.addToScene(loadedModel);

        loadedModel.add(audioRobot);
        audioRobot.play();

        setSpawned(true);

        shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer,
            {
                position: position,
                resolution: 512,
                blur: 2,
                animate: true,
                updateFrequency: 2,
            });

        clippingReveal = new ClippingReveal(loadedModel, SceneManager.renderer,
            {
                ringsRadius: 0.2,
                ringNumber: 4,
                ringThickness: 0.2,
                ringsColor: 0xf472b6,
                duration: 2.0,
                autoStart: true,
                startDelay: 200,
                fadeOutDuration: 2,
                onComplete: () => console.log('Reveal completed')
            });
    }
}