import { onMount, onCleanup, useContext } from "solid-js"
import { styled } from "solid-styled-components"
import ButtonCircle from "@components/ButtonCircle"
import SvgIcon from "@components/SvgIcon"
import Fa from "solid-fa"
import { faSave } from "@fortawesome/free-solid-svg-icons"
import { Context } from "@views/ar-overlay/arSession"

const ContainerToolbar = styled("div")`
    position: absolute;
    right: 1.5em;
    top: 20%;
    height: 50vh;
    display: flex;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`

const Toolbar = (props) => {
    const context = useContext(Context)

    onMount(() => {
        console.log(props.buttons)
        context.forceUpdateDomElements()
    })

    onCleanup(() => {
        context.forceUpdateDomElements()
    })

    return (
        <ContainerToolbar>
            {/* UNDO button */}
            <ButtonCircle
                data-interactive
                active={props.undoActive ?? true}
                visible={props.buttons.includes("undo")}
                border={false}
                onClick={props.onUndo}
            >
                <SvgIcon src={"icons/undo.svg"} size={18} />
            </ButtonCircle>
            {/* SAVE button */}
            <ButtonCircle
                data-interactive
                active={props.saveActive ?? true}
                visible={props.buttons.includes("save")}
                border={false}
                onClick={props.onSave}
            >
                <Fa icon={faSave} size="1.3x" class="icon" />
            </ButtonCircle>
        </ContainerToolbar>
    )
}

export default Toolbar
