import {
    onMount,
    createEffect,
    createSignal,
    createMemo,
    on,
    Show,
} from "solid-js"
import { styled } from "solid-styled-components"
import { SliderPicker } from "solid-color"
import { useGame } from "@js/gameBase"
import Reticle from "@js/reticle"
import Toolbar from "@views/ar-overlay/Toolbar"
import * as THREE from "three"
import useOnce from "@hooks/SolidJS/useOnce"
import SvgIcon from "@components/SvgIcon"
import { Text } from "troika-three-text"

const defaultGameData = []

export default function text(props) {
    const [currentText, setCurrentText] = createSignal(null)
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
    const { game } = useGame("text", props.id, {
        onTap: () => {
            if (props.selected) {
                // 1st TAP create light
                if (!currentText()) {
                    game.super.onTap()
                    createTextOnTap()
                }

                // 2nd TAP store light data
                else {
                    storeData()
                }
            }
        },

        renderLoop: () => {},
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

    // const toggleHelpers = (visible) => {
    //     game.setAssetVisibleByName("helper", visible)
    // }

    /*
     * Toggle the helpers visibility and the current light
     */
    createEffect(
        on(
            () => props.selected,
            (selected) => {
                // toggleHelpers(selected)
                if (!selected && currentText()) {
                    setCurrentText(null)
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
                createText(globalMatrix, color, intensity)
            })
            // toggleHelpers(props.selected)
        }
    )

    // region FUNCTIONS

    function handleUndo() {
        // sound
        game.onUndo()
        // deselect
        if (currentText()) setCurrentText(null)
        // remove last from scene
        game.removePreviousFromScene()
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1))
    }

    async function handleSave() {
        // deselect
        if (currentText()) setCurrentText(null)
        // save data on database
        await game.saveGameData()
        // reset
        setLastSavedGameData([...game.gameData()])
    }

    // spawn light on TAP
    function createTextOnTap() {
        const _text = createText(color(), intensity())
        setCurrentText(_text)
        Reticle.setEnabled(false)
    }

    function storeData() {
        const diffMatrix = game.getObjOffsetMatrix(
            props.referenceMatrix,
            currentText()
        )
        const newData = {
            intensity: currentText().intensity,
            color: currentText().color,
            diffMatrix: diffMatrix,
        }
        game.setGameData((prev) => [...prev, newData])

        setCurrentText(null)
        Reticle.setEnabled(true)

        console.log("light stored:", game.gameData())
    }

    // Create the text
    function createText(color, intensity) {
        console.log("createText")
        const newText = new Text()
       
        newText.text = "Hello world!"
        newText.fontSize = 0.2

        const p = new THREE.Vector3().setFromMatrixPosition(Reticle.getHitMatrix())

        
        newText.position.copy(p)
        newText.color = 0x9966ff
        newText.textAlign = 'center'
        newText.anchorX = 'center'

     

        game.addToScene(newText)

        newText.sync()

        console.log(newText.position)

        return newText
    }

    function handleChangeComplete(color) {
        const newColor = new THREE.Color(color.hex)
        currentText().color = newColor
    }

    //region RETICLE AND BLURRED COVER

    createEffect(
        on(
            () => [props.enabled, props.selected],
            ([enabled, selected]) => {
                if (
                    (game.appMode === "load" &&
                        enabled &&
                        game.gameDetails.interactable) ||
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

                        <Show when={currentText()}>
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
                        undoActive={
                            game.gameData().length > 0 && !currentText()
                        }
                        saveActive={hasUnsavedChanges() && !currentText()}
                    />
                </>
            </Show>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
