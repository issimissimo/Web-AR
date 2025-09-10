import { onMount, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';
import Message from '@components/Message';
import Button from '@components/Button';
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { TextureLoader, Vector3, Euler } from "three";

import { LoadTexture } from '@tools/three/textureUtils';
import RecreateMaterials from '@tools/three/recreateMaterials';
import ContactShadowsXR from '@tools/three/contactShadowsXR';
import SceneManager from '@js/sceneManager';


export default function testRobot(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);

    let loadedModel;
    let spawnedModel;
    let shadows;

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

            console.log("testRobot -- onTap")

            if (Reticle.visible() && Reticle.isHitting() && !showInstructions()) {
                const hitMatrix = Reticle.getHitMatrix();
                spawnModel(hitMatrix);
            }
        },

        renderLoop: () => loop()

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



        // const aoTexture = await loadTexture("models/RACER_UNWRAP_ANIM.png")
        // aoTexture.flipY = false;ù

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



        game.blurBackground(true);

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)

    });



    /*
    * LOOP
    */
    function loop() {
        
        if (game.loader.loaded() && spawnedModel !== null){

            // game.loader.animate();

            if (shadows) shadows.update();
        }
    }




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
    * RENDER
    */
    return (
        <>
            {
                showInstructions() && game.initialized() &&
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


    function spawnModel(matrix) {
        spawnedModel = game.loader.clone();
        // newModel.matrixAutoUpdate = false;

        const position = new Vector3();
        position.setFromMatrixPosition(matrix);

        const rotation = new Euler();
        rotation.setFromRotationMatrix(matrix);


        // newModel.matrix.copy(matrix);

        spawnedModel.position.copy(position);
        spawnedModel.rotation.copy(rotation);
        spawnedModel.rotateY(Math.PI / 2);


        game.addToScene(spawnedModel);


        shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer, {
            position: position,
            resolution: 512,
            blur: 2,
            animate: false
        });


        Reticle.setVisible(false);
    }


    // async function loadTexture(url, options = {}) {
    //     return new Promise((resolve, reject) => {
    //         new TextureLoader().load(
    //             url,
    //             (texture) => {
    //                 texture.flipY = options.flipY ?? true;
    //                 resolve(texture);
    //             },
    //             undefined,
    //             reject
    //         );
    //     });
    // }

}