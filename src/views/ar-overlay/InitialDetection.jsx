import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';
import Message from '@components/Message';


export default function InitialDetection() {


    /*
   * STYLE
   */
    const Container = styled('div')`
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2em;
    `

    return (
        <Container>
            <Message
                style={{ "height": "auto" }}
                svgIcon={'icons/tap.svg'}
                showReadMore={false}
            >
                Muovi il telefono in giro per farmi rilevare l'ambiente
            </Message>
        </Container>
    )
}