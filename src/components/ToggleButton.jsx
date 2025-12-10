
import { createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";

const StyledToggleButton = styled("div")`
        position: relative;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: center;
        width: fit-content;
        height: fit-content;
        /* flex-shrink: 0; */
        /* flex: 1; */
        flex-grow: 1;
        padding: 0.4rem;
        padding-left: 1rem;
        padding-right: 1rem;
        font-size: small;
        font-weight: 400;
        font-family: inherit;
        border-radius: 90px;
        background: ${(props) =>
            props.isOn
                ? "var(--color-secondary)"
                : props.theme === "dark"
                ? "var(--color-dark-transparent)"
                : "var(--color-background-transparent)"};
        border: none;
        pointer-events: ${(props) => (props.enabled ? "auto" : "none")};
        opacity: ${(props) => (props.enabled ? 1 : 0.5)};
        color: white;
        box-shadow: none;
        outline: none;
        z-index: 1;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.05s, color 0.05s;
    `

    const ToggleButton = (props) => {
        const handleOnClick = () => {
            props.onToggle(props.id)
        }

        return (
            <StyledToggleButton
                data-interactive
                // onClick={handleOnClick}
                onClick={props.onClick}
                style={props.style}
                class="glass"
                isOn={props.isOn}
                enabled={props.enabled ?? true}
                theme={props.theme ?? "dark"}
            >
                {props.children}
            </StyledToggleButton>
        )
    }

    export default ToggleButton