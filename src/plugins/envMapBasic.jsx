import { onMount, onCleanup, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import SceneManager from '@js/sceneManager';

import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EquirectangularReflectionMapping } from 'three';

export default function envMapBasic(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("envMapBasic", props.id, {

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
    }


    /*
    * On mount
    */
    onMount(() => {

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
        const rgbeLoader = new RGBELoader()
        rgbeLoader.load(game.gameData().fileName, (envMap) => {
            const environment = envMap;
            environment.mapping = EquirectangularReflectionMapping;
            SceneManager.scene.environment = environment;
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