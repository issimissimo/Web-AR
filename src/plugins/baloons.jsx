import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4, Vector3, Quaternion, PositionalAudio } from 'three';
import Reticle from '@js/reticle';
import { LoadPositionalAudio, LoadAudioBuffer } from '@tools/three/audioTools';
import { RecreateMaterials } from "@tools/three/materialTools";
import Toolbar from '@views/ar-overlay/Toolbar';
import SceneManager from "@js/sceneManager"



const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080, 0x000000];


export default function Baloons(props) {

    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);

    /*
    * Default DATA
    */
    const defaultGameData = [];


    let popAudioBuffer;
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

            if (props.enabled) {

                console.log("TAPPPP....")

                switch (game.appMode) {
                    case "save":
                        spawnModelOnTap();
                        break;

                    case "load":
                        // Explode
                        break;
                }
            }

        },

        renderLoop: () => loop()

    });



    /*
    * On mount
    */
    onMount(async () => {
        // load model
        await game.loader.load("models/balloon.glb");
        // load audio
        popAudioBuffer = await new LoadAudioBuffer("sounds/pop.ogg");
        // Setup data
        await game.loadGameData();
        if (!game.gameData()) {
            console.log("siccome non abbiamo caricato niente settiamo i dati di default")
            game.setGameData(defaultGameData);
        }
        // reset
        setLastSavedGameData([...game.gameData()]);

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
        console.log("Current reference matrix:", props.referenceMatrix)
    })






    const hasUnsavedChanges = createMemo(() =>
        JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
    );



    const handleUndo = () => {
        // super
        game.onUndo();
        // remove last from scene
        game.removePreviousFromScene();
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1));
    };


    const handleSave = async () => {
        // save data
        await game.saveGameData();
        // reset
        setLastSavedGameData([...game.gameData()]);
    };


    /*
    * SETUP SCENE
    */
    function setupScene() {
        switch (game.appMode) {
            case "save":
                Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                Reticle.setVisible(true);
                break;

            case "load":
                Reticle.setEnabled(false);
                break;
        }
        // wait a little before to spawn loaded models
        setTimeout(() => {
            if (game.gameData().length > 0)
                loadAllModels();
        }, 250)
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



    /*
    * Spawn loaded models
    */
    function loadAllModels() {
        const gameData = game.gameData();
        let currentIndex = 0;

        function loadNextBatch() {
            const batchSize = 1; // Carica 1 modello per frame
            const endIndex = Math.min(currentIndex + batchSize, gameData.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const assetData = gameData[i];

                let newModel = game.loader.clone({ randomizeTime: true });
                newModel = RecreateMaterials(newModel); // Important!!!
                newModel.matrixAutoUpdate = false;

                // position
                const diffMatrix = new Matrix4();
                diffMatrix.fromArray(assetData.diffMatrix.elements);
                const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                    (props.referenceMatrix, diffMatrix);
                newModel.matrix.copy(globalMatrix);

                // rotation
                newModel.rotation.y = Math.random() * Math.PI * 2;

                // color
                const colorIndex = assetData.color;
                newModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.name === "balloon") {
                        const newModelColor = balloonColors[colorIndex];
                        child.material = child.material.clone();
                        child.material.color = new Color(newModelColor);
                    }
                });

                // audio
                const audio = new PositionalAudio(SceneManager.listener);
                audio.setBuffer(popAudioBuffer);
                newModel.add(audio);

                game.addToScene(newModel);

                console.log("PLAY AUDIO")
                audio.play();
            }

            currentIndex = endIndex;

            // Se ci sono ancora modelli da caricare, continua nel prossimo frame
            if (currentIndex < gameData.length) {
                // requestAnimationFrame(loadNextBatch);
                setTimeout(() => {
                    loadNextBatch()
                }, 200)
            } else {
                console.log("Tutti i modelli caricati!");
            }
        }

        loadNextBatch();
    }


    /*
    * Spawn on TAP
    */
    function spawnModelOnTap() {

        console.log("SPAWN...")

        // get hitMatrix
        const hitMatrix = Reticle.getHitMatrix();

        // clone model
        let newModel = game.loader.clone({ randomizeTime: true });
        newModel = RecreateMaterials(newModel); // Important!!!
        let pos = new Vector3();
        let rot = new Quaternion();
        let scale = new Vector3();
        hitMatrix.decompose(pos, rot, scale);
        newModel.position.copy(pos);

        // rotation
        newModel.rotation.y = Math.random() * Math.PI * 2;

        // color
        let colorIndex;
        newModel.traverse((child) => {
            if (child.isMesh && child.material && child.material.name === "balloon") {
                colorIndex = Math.floor(Math.random() * balloonColors.length);
                const newModelColor = balloonColors[colorIndex];
                child.material = child.material.clone(); // clone per non cambiare il materiale originale
                child.material.color = new Color(newModelColor);
            }
        });

        // audio
        const audio = new PositionalAudio(SceneManager.listener);
        audio.setBuffer(popAudioBuffer);
        newModel.add(audio);

        // Add model to scene
        game.addToScene(newModel);

        audio.play();



        // const newModel_matrix = newModel.matrix;
        // console.log("NEW MATRIX:", newModel_matrix)
        // console.log("REF MATRIX:", props.referenceMatrix)

        // Set gameData
        const newModel_diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, newModel);
        // console.log("DIFF MATRIX:", newModel_diffMatrix)
        const newData = {
            color: colorIndex,
            diffMatrix: newModel_diffMatrix
        }
        game.setGameData((prev) => [...prev, newData])
    }




    /*
    * RENDER
    */
    //#region [render]


    const AuthorUI = () => {
        return (
            <>
                {/* <button onClick={() => spawnModelOnTap()}>SPAWN!</button> */}
                <Toolbar
                    buttons={["undo", "save"]}
                    onUndo={handleUndo}
                    onSave={handleSave}
                    undoActive={game.gameData().length > 0}
                    saveActive={hasUnsavedChanges()}
                />
            </>
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

}