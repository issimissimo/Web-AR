import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { styled } from 'solid-styled-components';
import { SliderPicker } from 'solid-color'
import { useGame } from '@js/gameBase';


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

    const [currentLight, setCurrentLight] = createSignal(null);
    const [intensity, setIntensity] = createSignal(5);
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);

    // const [color, setColor] = createSignal(0xffffff);


    const [color, setColor] = createSignal({
        r: 68,
        g: 107,
        b: 158,
        a: 1,
    })





    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("pointLights", props.id, {

        onTap: () => {

            if (props.selected) {

                console.log("TAPPPP....")

                switch (game.appMode) {
                    case "save":

                        if (!currentLight()) {
                            game.super.onTap(); // sound
                            spawnLightOnTap();
                        }

                        else {
                            storeLightInData();
                        }



                        break;

                    case "load":
                        break;
                }
            }
        },

        renderLoop: () => { }

    });


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
        // console.log("ADESSO CHIAMO SET INITIALIZED PER POINT LIGHT!!!!!")
        game.setInitialized()
    });


    // toggle the visibility of the helpers
    // AND set the non tappable UI elements
    createEffect(() => {
        console.log("POINT LIGHTS __ selected:", props.selected)
        game.setVisibleByName("helper", props.selected);

        // game.forceUpdateDomElements();
    })


    createEffect(() => {
        if (!props.selected && currentLight()) {

            //TODO: no! dobbiamo fare restore situazione originale, oppure lasciamo quella che è senza salvare
            // game.removePreviousFromScene();
            // game.removePreviousFromScene();

            setCurrentLight(null);
        }
    })


    const handleUndo = () => {
        // sound
        game.onUndo();
        // deselect
        if (currentLight()) setCurrentLight(null);
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
        // deselect
        if (currentLight()) setCurrentLight(null);
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

        // setTimeout(() => {
        //     game.forceUpdateDomElements();
        // }, 50)
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

    const handleChangeComplete = (color) => {
        console.log(color.hex)
        // setColor(color.rgb)
    }


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

    const ColorPickerContainer = styled('div')`
        margin-top: 2rem;
        /* margin-bottom: 2rem; */
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
                            {/* <button onClick={() => spawnLightOnTap()}>SPAWN!</button> */}
                            {currentLight() && (
                                <Container>
                                    <ColorPickerContainer id="slider" data-interactive>
                                        <SliderPicker color={color()} onChangeComplete={handleChangeComplete} />
                                    </ColorPickerContainer>
                                    {/* <ColorPicker color={color} setColor={setColor} /> */}

                                    {/* <HorizontalSlider value={intensity} setValue={setIntensity} />
                                    <Button onClick={storeLightInData} icon={faCheck} small={true}>
                                        Fatto!
                                    </Button> */}
                                </Container>
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


    // Delegate mounting to the shared game hook
    game.mountView(renderView);
}