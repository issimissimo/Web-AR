import { onMount, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';

import Message from '@components/Message';
import Button from '@components/Button';

import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { Matrix4 } from 'three';
import { config } from '@js/config';





export default function testRobot(props) {

    // const [spawnedModel, setSpawnedModel] = createSignal(null);
    const [showInstructions, setShowInstructions] = createSignal(true);



    const handleCloseInstructions = () => {

        setShowInstructions(() => false);

        game.blurBackground(false);

        Reticle.set({
            fileName: 'models/reticle_v1.glb'
        });
    }


    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("testRobot", props.id, {

        onTap: () => {

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



    /*
    * On mount
    */
    onMount(async () => {

        await game.loader.load("models/RobotArmNLA_compressed.glb");

        // game.blurBackground(true);

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
                        // onClick={handleCloseInstructions}
                        onClick={spawnModelForDebug}
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
        newModel.matrixAutoUpdate = false;
        newModel.matrix.copy(matrix);
        game.addToScene(newModel);
    }


    function spawnModelForDebug() {
        const newModel = game.loader.clone();
        newModel.position.z = -1;
        newModel.position.y = -0.5;
        game.addToScene(newModel);
    }

}