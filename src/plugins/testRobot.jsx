import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';

import { useGame } from '@js/gameBase';
import Reticle from '@js/reticle';
import SceneManager from '@js/sceneManager';

import Message from '@components/Message';
import Button from '@components/Button';
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { Vector3, Euler } from "three";
import { LoadTexture } from '@tools/three/textureTools';
import { LoadPositionalAudio } from '@tools/three/audioTools';
import { RecreateMaterials } from '@tools/three/materialTools';
import ContactShadowsXR from '@tools/three/contactShadowsXR';



export default function testRobot(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);

    let loadedModel,
        spawnedModel = null,
        shadows,
        audio;


    const handleCloseInstructions = () => {
        setShowInstructions(() => false);
        game.blurBackground(false);
        Reticle.setVisible(true);
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

                Reticle.setEnabled(false);
            }
        },


        renderLoop: () => {
            if (game.loader.loaded() && spawnedModel) {

                game.loader.animate();
                shadows.update();
            }
        },


        close: () => {
            if(shadows) shadows.dispose();
            if(audio) audio.stop();
        }

    });


    /*
    * DATA
    */



    /*
    * On mount
    */
    onMount(async () => {

        await Reticle.set(
            {
                fileName: 'models/reticle_v1.glb'
            });

        Reticle.setVisible(false);


        const aoTexture = await LoadTexture("models/RACER_UNWRAP_ANIM.png",
            {
                flipY: false
            });


        loadedModel = await game.loader.load("models/RACER_UNWRAP_ANIM.glb");
        loadedModel = RecreateMaterials(loadedModel,
            {
                aoMap: aoTexture,
                aoMapIntensity: 1.4
            });


        audio = await new LoadPositionalAudio("models/RACER_UNWRAP_ANIM.mp3", SceneManager.listener,
            {
                loop: true
            }
        );
        console.log("audio loaded!", audio)

        // blur background for instructions
        game.blurBackground(true);

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)

    });




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


    /*
    * RENDER (Will be shown ONLY after initialization completed)
    */
    return (
        <>
            {
                props.enabled && showInstructions() &&
                <Container>
                    <Message
                        style={{ "height": "auto" }}
                        svgIcon={'icons/tap.svg'}
                        showReadMore={false}
                    >
                        Fai TAP sullo schermo per posizionare il robot Comau RACER 3 su un piano. <br></br> Evita i piani troppo riflettenti o uniformi.
                    </Message>
                    <Button
                        onClick={handleCloseInstructions}
                        small={true}
                        active={true}
                        icon={faCheck}
                    >
                        Ho capito
                    </Button>
                </Container>
            }
        </>
    );


    //#region [functions]

    function spawnModel(matrix) {
        spawnedModel = game.loader.clone();

        const position = new Vector3();
        position.setFromMatrixPosition(matrix);

        const rotation = new Euler();
        rotation.setFromRotationMatrix(matrix);

        spawnedModel.position.copy(position);
        spawnedModel.rotation.copy(rotation);
        spawnedModel.rotateY(Math.PI / 2);
        game.addToScene(spawnedModel);

        spawnedModel.add(audio);
        audio.play();

        shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer, {
            position: position,
            resolution: 512,
            blur: 2,
            animate: true,
            updateFrequency: 2,
        });



    }
}