import { onMount, onCleanup, useContext } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import ButtonCircle from "@components/ButtonCircle"
import SvgIcon from "@components/SvgIcon"
import Fa from "solid-fa"
import { faSave } from "@fortawesome/free-solid-svg-icons"
import { Context } from "@views/ar-overlay/arSession"

const ContainerToolbar = styled(Motion.div)`
    position: absolute;
    right: 1.5em;
    top: 50%;
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    height: 25vh;
    display: flex;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    pointer-events: ${(props) => (props.visible ? "auto" : "none")};
`

const Toolbar = (props) => {
    const context = useContext(Context)

    onMount(() => {
        context.forceUpdateDomElements()
    })

    onCleanup(() => {
        context.forceUpdateDomElements()
    })

    return (
        <ContainerToolbar
            visible={props.visible ?? true}
            animate={{ opacity: props.visible ?? 1 ? 1 : 0 }}
            transition={{ duration: 0.25 }}
        >
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
