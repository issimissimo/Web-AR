import { onMount, createEffect, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4 } from 'three';
import Reticle from '@js/reticle';
import { LoadPositionalAudio } from '@tools/three/audioTools';


const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080];


export default function Baloons(props) {

    let popAudio;
    // const spawnedBalloons = [];
    // class SpawnedBalloon {
    //     constructor(model, revealSound, explodeSound = null){

    //     }
    // }


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

        console.log("**** BALOONS - ON MOUNT")

        await game.loader.load("models/baloon.glb");

        // popAudio = await new LoadPositionalAudio("sounds/pop.ogg", SceneManager.listener);

        if (props.stored) {
            // Load the game data from RealtimeDB
            await game.loadGameData();
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
        if (props.enabled) {
            console.log("BALOONS ENABLED!")
            setupScene();
        }
    })


    /*
    * SETUP SCENE
    */
    function setupScene() {

        Reticle.setEnabled(false);

        setTimeout(() => {
            if (props.stored) {
                loadAllModels();
            }
        },1000)



        //     const model = game.loader.model;
        //     model.position.z = -3;
        //     game.addToScene(model);



        //     game.setGameData(defaultGameData);

        //     // /// test per spawn
        //     // spawnModel();
    }


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
    //#region [render]


    const AuthorUI = () => {
        return (
            <Container>
                <Title>{game.gameDetails.title}</Title>
                <Description>{game.gameDetails.description}</Description>
                <button onClick={() => spawnModelOnTap()}>SPAWN!</button>
            </Container>
        )
    }


    const UserUI = () => {
        return (
            <div></div>
        )
    }





    return (
        <>
            {
                props.selected && (
                    (() => {
                        switch (game.appMode) {
                            case game.AppMode.SAVE:
                                return <AuthorUI />;
                            case game.AppMode.LOAD:
                                return <UserUI />;
                        }
                    })()
                )
            }
        </>
    );



    /*
    * FUNCTIONS
    */
    //#region [functions]

    // function loadAllModels() {
    //     game.gameData().forEach(assetData => {

    //         const newModel = game.loader.clone({ randomizeTime: true });
    //         newModel.matrixAutoUpdate = false;

    //         // position
    //         const offsetMatrix = new Matrix4();
    //         offsetMatrix.fromArray(assetData.diffMatrix.elements);

    //         const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
    //             (game.referenceMatrix, offsetMatrix);
    //         newModel.matrix.copy(globalMatrix);

    //         // color
    //         const colorIndex = assetData.color;
    //         newModel.traverse((child) => {
    //             if (child.isMesh && child.material && child.material.name === "baloon") {
    //                 const newModelColor = balloonColors[colorIndex];
    //                 child.material = child.material.clone(); // clone per non cambiare il materiale originale
    //                 child.material.color = new Color(newModelColor);
    //             }
    //         });

    //         game.addToScene(newModel);
    //     });
    // }

    function loadAllModels() {
        const gameData = game.gameData();
        let currentIndex = 0;

        function loadNextBatch() {
            const batchSize = 1; // Carica 1 modello per frame
            const endIndex = Math.min(currentIndex + batchSize, gameData.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const assetData = gameData[i];

                const newModel = game.loader.clone({ randomizeTime: true });
                newModel.matrixAutoUpdate = false;

                // position
                const offsetMatrix = new Matrix4();
                offsetMatrix.fromArray(assetData.diffMatrix.elements);

                const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                    (game.referenceMatrix, offsetMatrix);
                newModel.matrix.copy(globalMatrix);

                // color
                const colorIndex = assetData.color;
                newModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.name === "baloon") {
                        const newModelColor = balloonColors[colorIndex];
                        child.material = child.material.clone();
                        child.material.color = new Color(newModelColor);
                    }
                });

                game.addToScene(newModel);
                

            }

            currentIndex = endIndex;

            // Se ci sono ancora modelli da caricare, continua nel prossimo frame
            if (currentIndex < gameData.length) {
                requestAnimationFrame(loadNextBatch);
            } else {
                console.log("Tutti i modelli caricati!");
            }
        }

        loadNextBatch();
    }




    function spawnModelOnTap() {

        if (!props.enabled || !game.loader.loaded()) return;

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