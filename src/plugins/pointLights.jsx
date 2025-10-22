import { onMount, createEffect, createSignal, createMemo, on, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { SliderPicker } from "solid-color"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import Toolbar from "@views/ar-overlay/Toolbar"
import * as THREE from "three"
import useOnce from "@hooks/SolidJS/useOnce"
import SvgIcon from "@components/SvgIcon"

const defaultGameData = []

export default function pointLights(props) {
    const [currentLight, setCurrentLight] = createSignal(null)
    const [intensity, setIntensity] = createSignal(10)
    const [lastSavedGameData, setLastSavedGameData] = createSignal([])
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
                // 1st TAP create light
                if (!currentLight()) {
                    game.super.onTap()
                    spawnLightOnTap()
                }

                // 2nd TAP store light data
                else {
                    storeLightInData()
                }
            }
        },

        renderLoop: () => {},
    })

    const hasUnsavedChanges = createMemo(
        () => JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
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

    const toggleHelpers = (visible) => {
        game.setAssetVisibleByName("helper", visible)
    }

    /*
     * Toggle the helpers visibility and the current light
     */
    createEffect(
        on(
            () => props.selected,
            (selected) => {
                toggleHelpers(selected)
                if (!selected && currentLight()) {
                    setCurrentLight(null)
                }
            }
        )
    )

    /*
     * Load all saved lights
     */
    useOnce(
        () => props.enabled,
        () => {
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
            toggleHelpers(props.selected)
        }
    )

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
        // save data on database
        await game.saveGameData()
        // reset
        setLastSavedGameData([...game.gameData()])
    }

    // spawn light on TAP
    function spawnLightOnTap() {
        const _light = createLight(Reticle.getHitMatrix(), color(), intensity())
        setCurrentLight(_light)
        Reticle.setEnabled(false)
    }

    function storeLightInData() {
        const diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, currentLight())
        const newData = {
            intensity: currentLight().intensity,
            color: currentLight().color,
            diffMatrix: diffMatrix,
        }
        game.setGameData((prev) => [...prev, newData])

        setCurrentLight(null)
        Reticle.setEnabled(true)

        console.log("light stored:", game.gameData())
    }

    // Create the light and its helper
    function createLight(matrix, color, intensity) {
        const newLight = new THREE.PointLight(color, intensity)
        newLight.matrixAutoUpdate = false
        newLight.matrix.copy(matrix)
        newLight.intensity = intensity
        newLight.name = "pointLight"

        game.addToScene(newLight)

        const pointLightHelper = new THREE.PointLightHelper(newLight, 0.1, 0xf2e600)
        pointLightHelper.name = "helper"
        game.addToScene(pointLightHelper)
        
        return newLight
    }

    function handleChangeComplete(color) {
        const newColor = new THREE.Color(color.hex)
        currentLight().color = newColor
    }

    //region RETICLE AND BLURRED COVER

    createEffect(
        on(
            () => [props.enabled, props.selected],
            ([enabled, selected]) => {
                if (
                    (game.appMode === "load" && enabled && game.gameDetails.interactable) ||
                    (game.appMode === "save" && selected)
                ) {
                    Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET)
                    Reticle.setVisible(true)

                    game.handleBlurredCover({
                        visible: false,
                    })
                }
            }
        )
    )

    // region RENDER

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        position: relative;
    `

    const ColorPickerContainer = styled("div")`
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding-top: 2rem;
        padding-bottom: 2rem;
    `

    const Info = styled("div")`
        display: flex;
        box-sizing: border-box;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 2rem;
    `

    const renderView = () => {
        return (
            <Show when={props.selected}>
                <>
                    <Container>
                        <Info style={{ gap: "0.5rem" }}>
                            <SvgIcon
                                src={"icons/pointLight.svg"}
                                color={"var(--color-secondary)"}
                                size={25}
                            />
                            {game.gameData().length}
                        </Info>

                        <Show when={currentLight()}>
                            <ColorPickerContainer id="slider" data-interactive>
                                <SliderPicker
                                    color={color()}
                                    onChangeComplete={handleChangeComplete}
                                />
                            </ColorPickerContainer>
                        </Show>
                    </Container>

                    <Toolbar
                        buttons={["undo", "save"]}
                        onUndo={handleUndo}
                        onSave={handleSave}
                        undoActive={game.gameData().length > 0 && !currentLight()}
                        saveActive={hasUnsavedChanges() && !currentLight()}
                    />
                </>
            </Show>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
