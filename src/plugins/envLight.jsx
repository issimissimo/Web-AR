import { onMount, onCleanup, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import SceneManager from '@js/sceneManager';

import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader';
import { EquirectangularReflectionMapping } from 'three';
import decodeImageFormat from '@tools/three/decodeImageFormat';

export default function EnvLight(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("envLight", props.id, {

        onTap: () => {

        },

        renderLoop: () => {

        }
    });


    /*
    * DATA
    */
    const defaultGameData = {
        fileName: "images/hdr/spree_bank.hdr",
        rotation: 0
    }


    /*
    * On mount
    */
    onMount(() => {

        console.log("**** ENV LIGHT - ON MOUNT")

        // console.log("App MODE:", game.appMode);
        // console.log("stored:", props.stored);
        // console.log("DETAILS:", game.gameDetails)

        // if (props.stored) {
        //     // Load the game data from RealtimeDB
        //     game.loadGameData()
        // }
        // else {
        //     // Set default gameData
        //     game.setGameData(() => defaultGameData)
        // }


        game.setGameData(() => defaultGameData)
    });


    onCleanup(() => {
        if (SceneManager.initialized()) {
            SceneManager.scene.environment = null;
            SceneManager.scene.add(SceneManager.light);
        }
    })


    createEffect(() => {
        if (game.gameData()) {
            setupScene();
        }
    })



    /*
    * SETUP SCENE
    */
    function setupScene() {

        // initialize environment
        const rgbeLoader = new HDRLoader();
        rgbeLoader.load(game.gameData().fileName, (envMap) => {
            envMap.mapping = EquirectangularReflectionMapping;
            SceneManager.scene.environment = envMap;
            SceneManager.scene.environmentRotation = game.gameData().rotation;
            SceneManager.scene.remove(SceneManager.light);

            /*
            * Don't forget to call "game.setInitialized(true)" at finish 
            */
            game.setInitialized(true)
        });
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



    /*
    * RENDER
    */
    return (
        <>
            {
                props.selected && game.initialized() && (

                    <Container>
                        <Title>{game.gameDetails.title}</Title>
                        <Description>{game.gameDetails.description}</Description>
                        {/* <Button
                onClick={() => game.saveGame(gameData)}
            >Test salva game e dati</Button> */}
                        {/* <Button
                onClick={() => game.loadData(props.id, (data) => setGameData(() => data))}
            >Test carica dati</Button> */}
                    </Container>

                )
            }
        </>
    );

}