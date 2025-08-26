import { onMount, createEffect, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4 } from 'three';


export default function Baloons(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("baloons", props.id, {

        onTap: () => {

        },

        renderLoop: () => loop()

    });


    /*
    * Default DATA
    */
    const defaultGameData = [];


    /*
    * On mount
    */
    onMount(async () => {

        await game.loader.load("models/baloon.glb");


        if (props.stored) {
            // Load the game data from RealtimeDB
            game.loadGameData()
        }
        else {
            game.setGameData(defaultGameData);
        }



        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)
    });




    /*
    * On localizationCompleted
    */
    createEffect(() => {
        // if (game.localizationCompleted()) {

        //     async function waitForGltf() {
        //         while (!game.loader.loaded()) {
        //             await new Promise(resolve => setTimeout(resolve, 50));
        //         }
        //         setupScene();
        //     }

        //     waitForGltf();
        //     // setupScene();
        // }
    })


    /*
    * SETUP SCENE
    */
    // async function setupScene() {

    //     const model = game.loader.model;
    //     model.position.z = -3;
    //     game.addToScene(model);



    //     game.setGameData(defaultGameData);

    //     // /// test per spawn
    //     // spawnModel();
    // }


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
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2em;
        /* pointer-events: none; */
    `
    const Title = styled('h2')`
        text-align: center;
    `

    const Description = styled('p')`
        text-align: center;
    `


    /*
    * RENDER
    */
    return (
        <>
            {
                props.selected && (
                    <Container>
                        <Title>{game.gameDetails.title}</Title>
                        <Description>{game.gameDetails.description}</Description>
                        <button onClick={() => spawnModel()}>SPAWN!</button>
                    </Container>
                )
            }
        </>
    );


    /*
    * FUNCTIONS
    */


    function spawnModel() {

        if (!game.localizationCompleted() || !game.loader.loaded()) return;

        const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080];
        const newModel = game.loader.clone();

        newModel.position.set(
            MathUtils.randFloat(-1, 1),     // X: -1 a 1
            MathUtils.randFloat(-1.5, 1.5), // Y: -1.5 a 1.5
            MathUtils.randFloat(-3, -2)     // Z: -3 a -2
        );

        // Cerca il materiale "baloon" e cambia colore
        let colorIndex;
        newModel.traverse((child) => {
            if (child.isMesh && child.material && child.material.name === "baloon") {
                colorIndex = Math.floor(Math.random() * balloonColors.length);
                const newModelColor = balloonColors[colorIndex];
                child.material = child.material.clone(); // clone per non cambiare il materiale originale
                child.material.color = new Color(newModelColor);
            }
        });

        // Aggiunge il modello alla scena
        game.addToScene(newModel);

        // /// IMPORTANTE!!!!
        // newModel.updateMatrix(); // TODO spostarlo che venga fatto in automatico!

        const newModelMatrix = newModel.matrix;
        console.log("NEW MATRIX:", newModelMatrix)
        console.log("REF MATRIX:", game.referenceMatrix)

        const newModeldiffMatrix = game.getObjOffsetMatrix(game.referenceMatrix, newModel);
        console.log("DIFF MATRIX:", newModeldiffMatrix)



        const newData = {
            color: colorIndex,
            diffMatrix: newModeldiffMatrix
        }

        game.setGameData((prev) => [...prev, newData])

    }

}