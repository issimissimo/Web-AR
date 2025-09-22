import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { Vector3 } from 'three';
import Reticle from '@js/reticle';
import Toolbar from '@views/ar-overlay/Toolbar';
import { config } from '@js/config';
import * as THREE from "three";
import SceneManager from '@js/sceneManager';
import HorizontalSlider from '@views/ar-overlay/HorizontalSlider';
import ColorPicker from '@views/ar-overlay/ColorPicker';


const defaultGameData = [];


export default function pointLights(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("pointLights", props.id, {

        onTap: () => {

            if (props.enabled) {

                console.log("TAPPPP....")

                switch (game.appMode) {
                    case "save":
                        game.super.onTap(); // sound
                        spawnModelOnTap();
                        break;

                    case "load":
                        break;
                }
            }
        },

        renderLoop: () => { }

    });


    const [currentLight, setCurrentLight] = createSignal(null);
    const [intensity, setIntensity] = createSignal(5);
    const [color, setColor] = createSignal('#ff0000');
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);


    const hasUnsavedChanges = createMemo(() =>
        JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
    );



    /*
    * On mount
    */
    onMount(async () => {

        // load data
        await game.loadGameData();

        // set default data if no data are saved
        if (!game.gameData()) {
            game.setGameData(defaultGameData);
        }
        // or setup the lights from data
        else {
            loadLights();
        }

        // reset
        setLastSavedGameData([...game.gameData()]);

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)
    });


    const handleUndo = () => {
        // super
        game.onUndo();
        // remove last 2 from scene (light and helper)
        game.removePreviousFromScene();
        game.removePreviousFromScene();
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1));
    };


    // setup Reticle
    // as soon as this game is enabled
    createEffect(() => {
        if (props.enabled) {
            console.log("POINTLIGHTS ENABLED:", props.enabled)


            if (game.appMode === "save" || config.debugOnDesktop) {
                Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                Reticle.setEnabled(true);
                Reticle.setVisible(true);
            }
            else {
                Reticle.setEnabled(false); //TODO - questo può essere un problema, in congiunzione con altri games che invece vogliono il reticle...!
            }
        }
    });


    // remove or add default light
    // when data change
    createEffect(() => {

        if (!game.gameData()) return;

        const defaultLight = SceneManager.scene.getObjectByName("defaultLight");
        if (game.gameData().length > 0) {
            if (defaultLight) {
                SceneManager.scene.remove(SceneManager.light);
                console.log("defaultLight rimossa!")
            }
        }
        else {
            if (!defaultLight) {
                SceneManager.scene.add(SceneManager.light);
                console.log("defaultLight tornata!")
            }
        }
    });


    createEffect(() => {
        if (currentLight()) {
            console.log(intensity());
            console.log(color());
            currentLight().intensity = intensity();
            currentLight().color = new THREE.Color(color());
        }

    })

    const handleSave = async () => {
        // save data
        await game.saveGameData();
        // reset
        setLastSavedGameData([...game.gameData()]);
    };


    // spawn light on TAP
    function spawnModelOnTap() {
        const lightPosition = new Vector3().setFromMatrixPosition(Reticle.getHitMatrix());
        const lightColor = color();
        const lightIntensity = intensity();

        const _light = createLight(lightPosition, lightColor, lightIntensity);
        setCurrentLight(_light);
        console.log("currentLight:", currentLight())

        // get the difference from positions
        const referencePosition = new Vector3().setFromMatrixPosition(props.referenceMatrix);


        const diffPosition = new THREE.Vector3();
        diffPosition.subVectors(referencePosition, lightPosition);

        const newData = {
            diffPosition: { x: diffPosition.x, y: diffPosition.y, z: diffPosition.z },
            color: lightColor,
            intensity: lightIntensity
        };
        game.setGameData((prev) => [...prev, newData]);
    }


    // Load all lights
    function loadLights() {
        console.log("Adesso creo tutte le luci salvate....")

        game.gameData().forEach((el) => {
            const diffPosition = el.diffPosition;
            const color = el.color;
            const intensity = el.intensity;

            const referencePosition = new Vector3().setFromMatrixPosition(props.referenceMatrix);

            const position = referencePosition.clone().sub(
                new THREE.Vector3(diffPosition.x, diffPosition.y, diffPosition.z)
            );

            createLight(position, color, intensity)
        });
    }


    // Create the light and its helper
    function createLight(position, color, intensity) {
        const newLight = new THREE.PointLight(color, intensity);
        newLight.position.copy(position);
        newLight.name = "light";
        game.addToScene(newLight);

        const pointLightHelper = new THREE.PointLightHelper(newLight, 0.1);
        pointLightHelper.name = "helper";
        game.addToScene(pointLightHelper);

        return newLight;
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
    * RENDER (Will be shown ONLY after initialization completed)
    */
    return (

        <>
            <button onClick={() => spawnModelOnTap()}>SPAWN!</button>
            {/* <button onClick={() => {
                if (currentLight()) {

                    console.log("PRIMA:", currentLight())
                    // console.log("newcolor:", color())

                    const newColor = new THREE.Color(color());
                    console.log("newcolor:", newColor)

                    currentLight().color = newColor;
                    // console.log("DOPO:", currentLight())
                }
            }}>SET COLOR</button> */}

            {
                props.enabled && (
                    <>
                        {currentLight() && (
                            <>
                                <ColorPicker color={color} setColor={setColor} />
                                <HorizontalSlider value={intensity} setValue={setIntensity} />
                                <button onClick={() => console.log("DONE")}>DONE</button>
                            </>
                        )}

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
        </>
    );

}