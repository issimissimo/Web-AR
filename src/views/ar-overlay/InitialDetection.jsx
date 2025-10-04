import { onMount } from 'solid-js';
import Message from '@components/Message';
import { Centered } from '@components/smallElements';
import { Motion } from "solid-motionone"
import { styled } from "solid-styled-components"
import Reticle from "@js/reticle"


export default function InitialDetection() {
    

    onMount(()=>{
        // console.log("**** INTIAL DETECTION - ON MOUNT")
    })

    const Container = styled(Motion.div)`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 1.5em;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        margin: auto;
        z-index: 9;
    `

    return (
        <Container>
            <Message
                style={{ "height": "auto" }}
                svgIcon={'icons/phone.svg'}
                showReadMore={false}
            >
                Muovi un pò il telefono intorno per farmi rilevare le superfici
            </Message>
        </Container>
    )
}