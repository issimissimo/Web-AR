import { onMount, createEffect, createSignal } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4, Vector3, Quaternion } from 'three';
import Reticle from '@js/reticle';
import { LoadPositionalAudio } from '@tools/three/audioTools';


const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080];


export default function Baloons(props) {

    /*
    * Default DATA
    */
    const defaultGameData = [];

    let tempDiffMatrix;


    let popAudio;
    //  const spawnedBalloons = [];
    // class SpawnedBalloon {
    //     constructor(model, revealSound, explodeSound = null){

    //     }
    // }


    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("baloons", props.id, {

        onTap: () => {

            if (!props.enabled) return false;

            switch (game.appMode) {
                case "save":
                    spawnModelOnTap();
                    break;

                case "load":
                    // Explode
                    break;
            }

        },

        renderLoop: () => loop()

    });



    /*
    * On mount
    */
    onMount(async () => {

        console.log("**** BALOONS - ON MOUNT")
        console.log("game.appMode:", game.appMode)

        await game.loader.load("models/baloon.glb");

        // popAudio = await new LoadPositionalAudio("sounds/pop.ogg", SceneManager.listener);

        // Setup data
        // if (props.stored) await game.loadGameData();

        await game.loadGameData();

        if (!game.gameData()) {

            console.log("siccome non abbiamo caricato niente settiamo i dati di default")
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

    createEffect(() => {
        console.log("CCCBHHHH:", props.referenceMatrix)
    })


    /*
    * SETUP SCENE
    */
    function setupScene() {

        // Reticle.setEnabled(false);

        switch (game.appMode) {
            case "save":
                Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                Reticle.setVisible(true);
                break;

            case "load":
                Reticle.setEnabled(false);
                break;
        }

        // setTimeout(() => {
        //     if (props.stored) {
        //         loadAllModels();
        //     }
        // }, 1000)
        setTimeout(() => {
            if (game.gameData().length > 0)
                loadAllModels();
        }, 1000)



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
        // if (game.loader.loaded())
        //     game.loader.animate();
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
                props.enabled && (
                    (() => {
                        switch (game.appMode) {
                            case "save":
                                return <AuthorUI />;
                            case "load":
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

        console.log(">>> LOADED referenceMatrix:", props.referenceMatrix);

        function loadNextBatch() {
            const batchSize = 1; // Carica 1 modello per frame
            const endIndex = Math.min(currentIndex + batchSize, gameData.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const assetData = gameData[i];

                const newModel = game.loader.clone({ randomizeTime: true });
                newModel.matrixAutoUpdate = false;

                // position
                const diffMatrix = new Matrix4();
                diffMatrix.fromArray(assetData.diffMatrix.elements);

                const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                    (props.referenceMatrix, diffMatrix);
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


    function testReload() {
        setTimeout(() => {
            game.removePreviousFromScene();
            console.log("rimosso...")
        }, 3000)


        setTimeout(() => {

            const newModel = game.loader.clone();
            newModel.matrixAutoUpdate = false;

            
            console.log(tempDiffMatrix)
            
            const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                (props.referenceMatrix, tempDiffMatrix);
            newModel.matrix.copy(globalMatrix);

            game.addToScene(newModel);

        }, 6000)
    }



    function spawnModelOnTap() {

        console.log("SPAWN...")

        // if (!props.enabled || !game.loader.loaded()) return;

        const hitMatrix = Reticle.getHitMatrix();
        console.log(hitMatrix);



        const newModel = game.loader.clone();

        let pos = new Vector3();
        let rot = new Quaternion();
        let scale = new Vector3();

        hitMatrix.decompose(pos, rot, scale);
        console.log("pos:", pos);
        newModel.position.copy(pos);


        //  // TODO - usare hitMatrix per la posizione di newModel
        // newModel.position.set(
        //     MathUtils.randFloat(-1, 1),     // X: -1 a 1
        //     MathUtils.randFloat(-1.5, 1.5), // Y: -1.5 a 1.5
        //     MathUtils.randFloat(-3, -2)     // Z: -3 a -2
        // );

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

        const newModel_matrix = newModel.matrix;
        console.log("NEW MATRIX:", newModel_matrix)
        console.log("REF MATRIX:", props.referenceMatrix)

        const newModel_diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, newModel);
        console.log("DIFF MATRIX:", newModel_diffMatrix)

        

        const newData = {
            color: colorIndex,
            diffMatrix: newModel_diffMatrix
        }

        game.setGameData((prev) => [...prev, newData])



        // TEST
        tempDiffMatrix = newModel_diffMatrix;
        testReload();

    }

}