import { onMount, onCleanup, createEffect, createSignal, createMemo } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import SceneManager from '@js/sceneManager';

import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EquirectangularReflectionMapping } from 'three';
import Toolbar from '@views/ar-overlay/Toolbar';

export default function envMapBasic(props) {

    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("envMapBasic", props.id, {

        onTap: () => {

        },

        renderLoop: () => {

        },

        close: () => {

        },
    });


    /*
    * DATA
    */
    const defaultGameData = {
        fileName: "images/hdr/empty_warehouse_1k.hdr",
        exposure: 1
    }


    /*
    * On mount
    */
    onMount(async () => {
        console.log("|||||||||||||||||scene",SceneManager.scene)
        // load data
        await game.loadGameData();

        // set default data if no data are saved
        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            game.setGameData(defaultGameData);
        }

        // reset
        setLastSavedGameData(game.gameData());
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
            envMap.mapping = EquirectangularReflectionMapping;
            SceneManager.scene.environment = envMap;
            SceneManager.scene.environmentIntensity = game.gameData().exposure;
            SceneManager.scene.remove(SceneManager.light);

            const defaultLight = SceneManager.scene.getObjectByName("defaultLight");
            if (defaultLight) {
                SceneManager.scene.remove(SceneManager.light);
                console.log("******************defaultLight rimossa!")
            }

            /*
            * Don't forget to call "game.setInitialized()" at finish 
            */
            game.setInitialized()
        });
    }


    const hasUnsavedChanges = createMemo(() =>
        JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
    );


    const handleSave = async () => {
        // save data
        await game.saveGameData();
        // reset
        setLastSavedGameData(game.gameData());
    };




    /*
    * STYLE
    */
    const Container = styled('div')`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
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

    const renderView = () => {
        return (
            <>
                {
                    props.selected && (

                        <>
                            <Container>
                                <Title>{game.gameDetails.title}</Title>
                                <Description>{game.gameDetails.description}</Description>
                            </Container>

                            <Toolbar
                                buttons={["save"]}
                                onSave={handleSave}
                                saveActive={hasUnsavedChanges()}
                            />
                        </>

                    )
                }
            </>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView);

}