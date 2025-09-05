import { onMount, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';
import Message from '@components/Message';
import Button from '@components/Button';
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { MeshStandardMaterial, PlaneGeometry, MeshBasicMaterial, Mesh, TextureLoader, Vector3, Euler } from "three";


export default function testRobot(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);


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

            if (Reticle.isHitting() && !showInstructions()) {
                const hitMatrix = Reticle.getHitMatrix();
                spawnModel(hitMatrix);
            }
        },

        renderLoop: () => loop()

    });


    /*
    * DATA
    */

    let planeShadow;

    /*
    * On mount
    */
    onMount(async () => {

        Reticle.set({
            fileName: 'models/reticle_v1.glb'
        });
        Reticle.setVisible(false);


        const planeTexture = await loadTexture('models/shadow.jpg');
        const planeGeo = new PlaneGeometry(0.7, 0.7);
        planeGeo.rotateX(- Math.PI / 2);
        const planeMat = new MeshBasicMaterial({
            alphaMap: planeTexture,
            transparent: true,
            color: 0x000000,
        });
        planeShadow = new Mesh(planeGeo, planeMat);


        const aoTexture = await loadTexture("models/robot_AO_02.png")
        aoTexture.flipY = false;


        const model = await game.loader.load("models/robot_unwrapped.glb");
        // now we NEED to recreate the materials
        // of the unwrapped model... :/
        model.traverse((child) => {
            if (child.isMesh) {
                const mat = new MeshStandardMaterial({
                    aoMap: aoTexture,
                    aoMapIntensity: 1,
                    color: child.material.color,
                    metalness: child.material.metalness,
                    roughness: child.material.roughness
                });
                child.material = mat;
                child.material.needsUpdate = true;
            }
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
        // if (game.loader.loaded())
        //     game.loader.animate();
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
                        Fai TAP sullo schermo per posizionare un robot su una superficie che individuo intorno a te.
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
        const newModel = game.loader.clone();
        // newModel.matrixAutoUpdate = false;

        const position = new Vector3();
        position.setFromMatrixPosition(matrix);

        const rotation = new Euler();
        rotation.setFromRotationMatrix(matrix);

        const scale = new Vector3(1.5, 1.5, 1.5);

        // newModel.matrix.copy(matrix);

        newModel.position.copy(position);
        newModel.rotation.copy(rotation);
        newModel.scale.copy(scale);

        game.addToScene(newModel);

        // planeShadow.matrixAutoUpdate = false;
        // planeShadow.matrix.copy(matrix);
        planeShadow.position.copy(position);
        planeShadow.rotation.copy(rotation);

        game.addToScene(planeShadow);

        Reticle.setVisible(false);
    }


    async function loadTexture(url) {
        return new Promise((resolve, reject) => {
            new TextureLoader().load(url, resolve, undefined, reject);
        });
    }

}