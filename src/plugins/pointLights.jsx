import { onMount, onCleanup, createEffect, createSignal, createMemo } from 'solid-js';
import { render } from 'solid-js/web';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { Vector3 } from 'three';
import Reticle from '@js/reticle';
import Toolbar from '@views/ar-overlay/Toolbar';
import { config } from '@js/config';
import * as THREE from "three";
import HorizontalSlider from '@views/ar-overlay/HorizontalSlider';
// import ColorPicker from '@views/ar-overlay/ColorPicker';
import Button from '@components/Button';
import { faCheck } from "@fortawesome/free-solid-svg-icons"


const defaultGameData = [];
let _enabled = false;


export default function pointLights(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("pointLights", props.id, {

        onTap: () => {

            if (props.enabled && !currentLight()) {

                console.log("TAPPPP....")

                switch (game.appMode) {
                    case "save":
                        game.super.onTap(); // sound
                        spawnLightOnTap();
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
    const [color, setColor] = createSignal(0xffffff);
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);
    const [mountEl, setMountEl] = createSignal(null);
    let _disposer = null;

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
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            game.setGameData(defaultGameData);
        }

        // reset
        setLastSavedGameData([...game.gameData()]);

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        console.log("ADESSO CHIAMO SET INITIALIZED PER POINT LIGHT!!!!!")
        game.setInitialized()

        // // Wait for the #plugins-ui container to exist. The container may be
        // // created dynamically by other Solid components, so querying it
        // // immediately can return null. Use a MutationObserver with a
        // // short timeout fallback and store the element in a signal so the
        // // Portal can be rendered reactively below.
        // const waitFor = () => new Promise((resolve) => {
        //     const el = document.getElementById('plugins-ui');
        //     if (el) return resolve(el);
        //     const obs = new MutationObserver(() => {
        //         const f = document.getElementById('plugins-ui');
        //         if (f) { obs.disconnect(); resolve(f); }
        //     });
        //     obs.observe(document.body, { childList: true, subtree: true });
        // });

        // const el = await waitFor();
        // if (el) setMountEl(el);
    });


    // toggle the visibility of the helpers
    createEffect(() => {
        console.log("POINT LIGHTS __ selected:", props.selected)
        game.setVisibleByName("helper", props.selected);
    })


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
        if (props.enabled && !_enabled) {
            console.log("POINTLIGHTS ENABLED:", props.enabled)
            _enabled = true;


            if (game.appMode === "save" || config.debugOnDesktop) {
                Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                Reticle.setEnabled(true);
                Reticle.setVisible(true);
            }
            else {
                Reticle.setEnabled(false); //TODO - questo può essere un problema, in congiunzione con altri games che invece vogliono il reticle...!
            }

            loadAllLights();
        }
    });


    createEffect(() => {
        if (currentLight()) {
            currentLight().intensity = intensity() / 2;
        }

    })

    const handleSave = async () => {
        // save data
        await game.saveGameData();
        // reset
        setLastSavedGameData([...game.gameData()]);
    };


    // spawn light on TAP
    function spawnLightOnTap() {
        const _light = createLight(Reticle.getHitMatrix(), color(), intensity());
        setCurrentLight(_light);
        console.log("currentLight:", currentLight())
    }


    function storeLightInData() {

        const diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, currentLight());
        const newData = {
            intensity: currentLight().intensity,
            diffMatrix: diffMatrix
        };
        game.setGameData((prev) => [...prev, newData]);

        setCurrentLight(null);

        console.log("light stored:", game.gameData());
    }


    // Load all lights
    function loadAllLights() {
        console.log(">>>>>>>>>>>>> CREO ", game.gameData().length, " LUCI SALVATE!!!")

        game.gameData().forEach((el) => {
            console.log(el)


            // position
            const diffMatrix = new THREE.Matrix4();
            diffMatrix.fromArray(el.diffMatrix.elements);
            const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                (props.referenceMatrix, diffMatrix);

            const color = el.color;
            const intensity = el.intensity;
            createLight(globalMatrix, color, intensity)
        });

        // hide the helpers
        game.setVisibleByName("helper", props.selected);
    }


    // Create the light and its helper
    function createLight(matrix, color, intensity) {

        const newLight = new THREE.PointLight(color, intensity);
        newLight.matrixAutoUpdate = false;
        newLight.matrix.copy(matrix);
        newLight.intensity = intensity;
        newLight.name = "pointLight";
        game.addToScene(newLight);

        const pointLightHelper = new THREE.PointLightHelper(newLight, 0.1, 0xf2e600);
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


    /*
    * RENDER
    */

    const renderView = () => {
        return (
            <>
                {
                    props.selected && (
                        <>
                            <button onClick={() => spawnLightOnTap()}>SPAWN!</button>
                            {currentLight() && (
                                <>
                                    {/* <ColorPicker color={color} setColor={setColor} /> */}
                                    <HorizontalSlider value={intensity} setValue={setIntensity} />
                                    <Button onClick={storeLightInData} icon={faCheck} small={true}>
                                        Fatto!
                                    </Button>
                                </>
                            )}

                            <Toolbar
                                buttons={["undo", "save"]}
                                onUndo={handleUndo}
                                onSave={handleSave}
                                undoActive={game.gameData().length > 0}
                                saveActive={hasUnsavedChanges() && !currentLight()}
                            />
                        </>
                    )
                }
            </>
        )
    }


    createEffect(() => {
        if (!game.mountEl() || _disposer) return;
        _disposer = render(renderView, game.mountEl());
    });
}