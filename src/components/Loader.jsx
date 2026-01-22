import { createSignal, onMount, onCleanup, Show } from "solid-js"
import { styled, keyframes } from "solid-styled-components"

// Keyframes per le animazioni
const spin = keyframes`
  0% {
    transform: rotate(0deg);
    opacity: 1;
    border-width: 3px;
  }
  50% {
    opacity: 0.5;
    border-width: 1px;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0;
    border-width: 3px;
  }
`

const spinReverse = keyframes`
  0% {
    transform: rotate(0deg);
    opacity: 1;
    border-width: 3px;
  }
  50% {
    opacity: 0.5;
    border-width: 1px;
  }
  100% {
    transform: rotate(-360deg);
    opacity: 0;
    border-width: 3px;
  }
`

// Styled Components
const LoaderContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    background-color: transparent;
    opacity: ${(props) => (props.isVisible ? 1 : 0)};
    transition: opacity 1s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
`

const LoaderInnerContainer = styled.div`
    position: relative;
    width: 35px;
    height: 35px;
`

const LoaderSpinner = styled.span`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-radius: 50%;
    box-sizing: border-box;
    border-top-color: white;
    animation: ${spin} 1.5s cubic-bezier(0.15, 0.62, 0.28, 0.97) infinite;
`

const LoaderSpinner2 = styled.span`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-radius: 50%;
    box-sizing: border-box;
    border-bottom-color: white;
    animation: ${spinReverse} 1.5s cubic-bezier(0.15, 0.62, 0.28, 0.97) infinite;
    animation-delay: 0.75s;
`

const LoaderText = styled.div`
    position: absolute;
    transform: translateY(40px);
    color: white;
    font-size: small;
    font-weight: 300;
    opacity: 0.8;
    text-align: center;
    width: 100%;
`

// Componente Loader
const Loader = (props) => {
    const [isVisible, setIsVisible] = createSignal(false)
    let timeoutId

    const show = (delay = 0) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            setIsVisible(true)
        }, delay)
    }

    const hide = (delay = 0) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            setIsVisible(false)
        }, delay)
    }

    const toggle = (delay = 0) => {
        if (isVisible()) {
            hide(delay)
        } else {
            show(delay)
        }
    }

    // Inizializzazione del loader (equivalente al costruttore della classe originale)
    onMount(() => {
        show(0)
    })

    // Cleanup dei timeout
    onCleanup(() => {
        if (timeoutId) clearTimeout(timeoutId)
    })

    // Esponi i metodi tramite props.ref se fornito
    if (props.ref) {
        props.ref({ show, hide, toggle, isVisible })
    }

    return (
        <LoaderContainer isVisible={isVisible()}>
            <LoaderInnerContainer>
                <LoaderSpinner />
                <LoaderSpinner2 />
            </LoaderInnerContainer>
            <Show when={props.text}>
                <LoaderText>
                    {props.text}
                </LoaderText>
            </Show>
        </LoaderContainer>
    )
}

export default Loader
