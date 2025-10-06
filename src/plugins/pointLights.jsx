import { onMount, createEffect, createSignal, createMemo, on } from "solid-js"
import { styled } from "solid-styled-components"
import { SliderPicker } from "solid-color"
import { useGame } from "@js/gameBase"

import Reticle from "@js/reticle"
import Toolbar from "@views/ar-overlay/Toolbar"
import { config } from "@js/config"
import * as THREE from "three"
import useOnce from '@hooks/SolidJS/useOnce';
// import HorizontalSlider from '@views/ar-overlay/HorizontalSlider';
// import ColorPicker from '@views/ar-overlay/ColorPicker';
// import Button from '@components/Button';
// import { faCheck } from "@fortawesome/free-solid-svg-icons"

const defaultGameData = []

export default function pointLights(props) {
    const [currentLight, setCurrentLight] = createSignal(null)
    const [intensity, setIntensity] = createSignal(5)
    const [lastSavedGameData, setLastSavedGameData] = createSignal([])

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
                // if we have not created a new light
                // create a new one
                if (!currentLight()) {
                    game.super.onTap()
                    spawnLightOnTap()
                }

                // or store the current light data
                else {
                    storeLightInData()
                }
            }
        },

        renderLoop: () => { },
    })

    const hasUnsavedChanges = createMemo(
        () =>
            JSON.stringify(game.gameData()) !==
            JSON.stringify(lastSavedGameData())
    )

    // region LIFECYCLE

    /*
     * On mount
     */
    onMount(async () => {
        // load data
        await game.loadGameData()

        // set default data if no data are saved
        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            game.setGameData(defaultGameData)
        }

        // reset
        setLastSavedGameData([...game.gameData()])

        /*
         * Don't forget to call "game.setInitialized(true)" at finish
         */
        game.setInitialized()
    })

    // region EFFECTS

    // react when this component is selected or not,
    // and when there's currentLight (that means that
    // we have just created a new light)
    createEffect(
        on([() => props.selected, currentLight], ([selected, light]) => {
            // toggle the visibility of the helpers
            game.setAssetVisibleByName("helper", selected)

            // if this component is not selected anymore
            // we don't want to have currentLight anymore too
            if (!selected && light) {
                setCurrentLight(null)
            }
        })
    )

    // // react when this component is enabled
    // createEffect(
    //     on(
    //         () => props.enabled,
    //         (enabled) => {
    //             if (enabled) {
    //                 console.log("POINTLIGHTS IS ENABLED!")

    //                 // setup Reticle
    //                 // as soon as this component is enabled
    //                 if (game.appMode === "save") {
    //                     Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET)
    //                     Reticle.setEnabled(true)
    //                     Reticle.setVisible(true)
    //                 }

    //                 // load all saved lights
    //                 loadAllLights()
    //             }
    //         }
    //     )
    // )

    useOnce(() => props.enabled, () => {
        console.log("POINTLIGHTS IS ENABLED!")

        // setup Reticle
        // as soon as this component is enabled
        if (game.appMode === "save") {
            Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET)
            Reticle.setEnabled(true)
            Reticle.setVisible(true)
        }

        // load all saved lights
        loadAllLights()
    });

    // createEffect(() => {
    //     if (currentLight()) {
    //         currentLight().intensity = intensity() / 2;
    //     }

    // })

    createEffect(() => {
        console.log("****************************")
        console.log("props.selected:", props.selected)
        console.log("currentLight:", currentLight())
        console.log("****************************")
    })

    // region FUNCTIONS

    function handleUndo() {
        console.log("UNDO STARTED:", game.gameData())
        // sound
        game.onUndo()
        // deselect
        if (currentLight()) setCurrentLight(null)
        // remove last 2 from scene (light and helper)
        game.removePreviousFromScene()
        game.removePreviousFromScene()
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1))

        console.log("UNDO FINISHED:", game.gameData())
    }

    async function handleSave() {
        // deselect
        if (currentLight()) setCurrentLight(null)
        // save data
        await game.saveGameData()
        // reset
        setLastSavedGameData([...game.gameData()])
    }

    // spawn light on TAP
    function spawnLightOnTap() {
        const _light = createLight(Reticle.getHitMatrix(), color(), intensity())
        setCurrentLight(_light)
    }

    function storeLightInData() {
        const diffMatrix = game.getObjOffsetMatrix(
            props.referenceMatrix,
            currentLight()
        )
        const newData = {
            intensity: currentLight().intensity,
            color: currentLight().color,
            diffMatrix: diffMatrix,
        }
        game.setGameData((prev) => [...prev, newData])

        setCurrentLight(null)

        console.log("light stored:", game.gameData())
    }

    // Load all lights
    function loadAllLights() {
        console.log(
            ">>>>>>>>>>>>> CREO ",
            game.gameData().length,
            " LUCI SALVATE!!!"
        )

        game.gameData().forEach((el) => {
            console.log(el)

            // position
            const diffMatrix = new THREE.Matrix4()
            diffMatrix.fromArray(el.diffMatrix.elements)
            const globalMatrix = game.getGlobalMatrixFromOffsetMatrix(
                props.referenceMatrix,
                diffMatrix
            )

            const color = el.color
            const intensity = el.intensity
            createLight(globalMatrix, color, intensity)
        })

        // hide the helpers
        game.setAssetVisibleByName("helper", props.selected)
    }

    // Create the light and its helper
    function createLight(matrix, color, intensity) {
        const newLight = new THREE.PointLight(color, intensity)
        newLight.matrixAutoUpdate = false
        newLight.matrix.copy(matrix)
        newLight.intensity = intensity
        newLight.name = "pointLight"

        // const pointLightHelper = new THREE.PointLightHelper(newLight, 0.1, 0xf2e600);
        // pointLightHelper.name = "helper";
        // pointLightHelper.matrixAutoUpdate = false;
        // pointLightHelper.matrix.identity();
        // newLight.add(pointLightHelper);

        game.addToScene(newLight)

        const pointLightHelper = new THREE.PointLightHelper(
            newLight,
            0.1,
            0xf2e600
        )
        pointLightHelper.name = "helper"
        game.addToScene(pointLightHelper)

        return newLight
    }

    function handleChangeComplete(color) {
        console.log(color.hex)
        // setColor(color.rgb)
        const newColor = new THREE.Color(color.hex)
        currentLight().color = newColor
    }

    // region RENDER

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    `

    const ColorPickerContainer = styled("div")`
        padding-top: 2rem;
        padding-bottom: 2rem;
    `

    const renderView = () => {
        return (
            <>
                {props.selected && (
                    <>
                        {currentLight() && (
                            <Container>
                                <ColorPickerContainer
                                    id="slider"
                                    data-interactive
                                >
                                    <SliderPicker
                                        color={color()}
                                        onChangeComplete={handleChangeComplete}
                                    />
                                </ColorPickerContainer>
                            </Container>
                        )}

                        <Toolbar
                            buttons={["undo", "save"]}
                            onUndo={handleUndo}
                            onSave={handleSave}
                            undoActive={
                                game.gameData().length > 0 && !currentLight()
                            }
                            saveActive={hasUnsavedChanges() && !currentLight()}
                        />
                    </>
                )}
            </>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
