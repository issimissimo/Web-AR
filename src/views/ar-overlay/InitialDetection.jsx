import { onMount } from 'solid-js';
import Message from '@components/Message';
import { Centered } from '@components/smallElements';
import Reticle from "@js/reticle"


export default function InitialDetection() {
    

    onMount(()=>{
        // console.log("**** INTIAL DETECTION - ON MOUNT")
        Reticle.setSurfType(Reticle.SURF_TYPE_MODE.ALL)
    })

    return (
        <Centered>
            <Message
                style={{ "height": "auto" }}
                svgIcon={'icons/phone.svg'}
                showReadMore={false}
            >
                Muovi un pò il telefono intorno per farmi rilevare le superfici
            </Message>
        </Centered>
    )
}