import { onMount, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';
import Message from '@components/Message';
import Button from '@components/Button';
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { TextureLoader, Vector3, Euler } from "three";

import RecreateMaterials from '@tools/three/recreateMaterials';


export default function testRobot(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);

    let model;

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

        await Reticle.set({
            fileName: 'models/reticle_v1.glb'
        });
        Reticle.setVisible(false);


        // const planeTexture = await loadTexture('models/shadow.jpg');
        // const planeGeo = new PlaneGeometry(0.7, 0.7);
        // planeGeo.rotateX(- Math.PI / 2);
        // const planeMat = new MeshBasicMaterial({
        //     alphaMap: planeTexture,
        //     transparent: true,
        //     color: 0x000000,
        // });
        // planeShadow = new Mesh(planeGeo, planeMat);


        const aoTexture = await loadTexture("models/RACER_UNWRAP_ANIM.png")
        aoTexture.flipY = false;


        model = await game.loader.load("models/RACER_UNWRAP_ANIM.glb");
        // now we NEED to recreate the materials
        // of the unwrapped model... :/
        // model.traverse((child) => {
        //     if (child.isMesh) {
        //         const mat = new MeshStandardMaterial({
        //             aoMap: aoTexture,
        //             aoMapIntensity: 1,
        //             color: child.material.color,
        //             metalness: child.material.metalness,
        //             roughness: child.material.roughness
        //         });
        //         child.material = mat;
        //         child.material.needsUpdate = true;
        //     }
        // });
        model = RecreateMaterials(model, {
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
        if (game.loader.loaded())
            game.loader.animate();
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


        // newModel.matrix.copy(matrix);

        newModel.position.copy(position);
        newModel.rotation.copy(rotation);
        

        game.addToScene(newModel);




        Reticle.setVisible(false);
    }


    async function loadTexture(url) {
        return new Promise((resolve, reject) => {
            new TextureLoader().load(url, resolve, undefined, reject);
        });
    }

}