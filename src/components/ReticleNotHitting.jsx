import { createSignal, onMount, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"

export const BaseIconOverlay = () => {
    const Container = styled(Motion.div)`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
    `

    return <Container></Container>
}

export const WaitingForScanIconOverlay = () => {
    const Container = styled(Motion.div)`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
    `

    return <Container></Container>
}

export const NotHittingIconOverlay = () => {
    const Container = styled(Motion.div)`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
    `

    return <Container></Container>
}


