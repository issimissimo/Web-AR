import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import Fa from "solid-fa"

const StyledButton = styled(Motion.button)`
    font-family: 'SebinoSoftMedium';
    position: relative;
    /* display: ${(props) => (props.visible ? "block" : "none")}; */
    visibility: ${(props) => (props.visible ? "visible" : "hidden")};
    /* width: 100%; */
    width: ${(props) => props.width || "80%"};
    flex-shrink: 0;
    padding: ${(props) => (props.small ? "0.6rem" : "0.7rem")};
    font-size: ${(props) => (props.small ? "var(--font-size-regular)" : "var(--font-size-large)")};
    /* font-weight: 600; */
    /* font-family: "SebinoSoftMedium"; */
    border-radius: 90px;
    /* background: ${(props) => (props.background ? props.background : "var(--color-background)")}; */
    /* background: var(--color-background); */
    /* background: rgba(180, 21, 130, 0.4); */
    background: ${(props) => props.background || "var(--color-background)"};
    border: ${(props) => (props.border ? (props.small ? "0px solid" : "3px solid") : "1px solid")};
    /* border: none; */
    border-color: ${(props) =>
        props.border ? (props.grey ? "var(--color-grey)" : "var(--color-accent)") : "transparent"};
    pointer-events: ${(props) => (props.active ? "auto" : "none")};
    color: ${(props) => (props.grey ? "var(--color-grey)" : "var(--color-accent)")};
    box-shadow: none;
    outline: none;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.05s, color 0.05s;
    &:focus {
        outline: none;
    }
    &:active {
        background: ${(props) =>
            props.grey ? "var(--color-grey-dark)" : "var(--color-primary-dark)"};
        color: var(--color-background);
        border-color: ${(props) => (props.grey ? "var(--color-grey)" : "var(--color-accent)")};
    }
`

const Button = (props) => {
    const handleOnClick = () => {
        setTimeout(() => {
            props.onClick()
        }, 250)
    }

    const Icon = () => <Fa icon={props.icon} size="1x" translateX={1} class="icon" />

    return (
        <StyledButton
            onClick={handleOnClick}
            active={props.active ?? true}
            visible={props.visible ?? true}
            grey={props.grey}
            border={props.border ?? props.active ? true : false}
            background={props.background}
            small={props.small ?? false}
            class={props.class}
            style={props.style}
            width={props.width}
            animate={{ opacity: props.active ?? 1 ? 1 : 0.4 }}
            transition={{ duration: 0.25 }}
        >
            {props.children}
            {props.icon && <Icon />}
        </StyledButton>
    )
}

export default Button
