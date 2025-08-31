import { onMount, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { Matrix4 } from 'three';
import Reticle from '@js/reticle';
import Message from '@components/Message';




export default function testRobot(props) {

    const [spawnedModel, setSpawnedModel] = createSignal(null);


    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("testRobot", props.id, {

        onTap: () => {

            console.log("IS HITTING:", Reticle.isHitting());

            if (Reticle.isHitting()) {
                const hitMatrix = Reticle.getHitMatrix();
                console.log("HIT MATRIX:", hitMatrix);
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

        Reticle.set({
            fileName: 'models/gizmo.glb'
        });

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)

    });


    /*
    * SETUP SCENE
    */
    // let cube;
    // function setupScene() {
    //     const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    //     const material = new MeshBasicMaterial({ color: 0x00ff00 });
    //     const material2 = new MeshPhysicalMaterial({ color: 0x00ff00, metalness: 0, roughness: 0.1 });
    //     cube = new Mesh(geometry, material2);
    //     cube.position.z = -1;
    //     game.addToScene(cube);


    // }


    /*
    * LOOP
    */
    function loop() {
        if (spawnedModel())
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
    const Title = styled('h2')`
        text-align: center;
    `

    const Description = styled('p')`
        text-align: center;
    `

    const Button = styled('button')`
        margin: 1em;
    `



    /*
    * RENDER
    */
    return (
        <>
            {/* {
                !spawnedModel() &&
                <Container>
                    <Title>{game.gameDetails.title}</Title>
                    <Description>{game.gameDetails.description}</Description>
                    <button onClick={() => {
                        const fakeHitMatrix = new Matrix4();
                        spawnModel(fakeHitMatrix)
                    }}>SPAWN!</button>
                </Container>
            } */}

            {
                !spawnedModel() &&
                <Container>
                    <Message
                        svgIcon={'/icons/tap.svg'}
                        showReadMore={false}
                    >
                        Fai TAP sullo schermo per posizionare un robot su una superficie piana intorno a te
                    </Message>
                </Container>
            }

        </>

    );


    function spawnModel(matrix) {


        const newModel = game.loader.clone();


        // newModel.position.z = -2;

        newModel.matrixAutoUpdate = false;
        newModel.matrix.copy(matrix);



        game.addToScene(newModel);
        setSpawnedModel(() => newModel);
    }

}