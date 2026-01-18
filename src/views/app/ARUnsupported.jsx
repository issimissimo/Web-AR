import { onMount } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import { faSadCry } from "@fortawesome/free-solid-svg-icons"
import { init } from "@hooks/useQRCode"

import { Centered } from "@components/smallElements"
import Message from "@components/Message"

const Container = styled(Centered)`
    justify-content: center;
`

const QrCodeContainer = styled(Motion.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
`

const QrCodeImg = styled("img")`
    text-align: center;
    z-index: 99;
    width: 150px;
`

export default function ARUnsupported() {
    onMount(() => {
        // create Qr Code
        init()
    })

    return (
        <Container>
            <div>
                <Message icon={faSadCry}>
                    Purtroppo il tuo dispositivo o il browser che utilizzi non è
                    compatibile con questa esperienza di realtà aumentata
                    <br></br>
                    <br></br>{" "}
                    <span style={{ color: "var(--color-secondary)" }}>
                        Apri il link o scansiona il QrCode con un dispositivo
                        compatibile <br></br>
                        <br></br>
                        <span style={{ "font-family": "SebinoSoftBold" }}>
                            Android con Chrome <br></br> iOS con Safari{" "}
                        </span>
                    </span>
                </Message>
            </div>

            <div>
                <QrCodeContainer
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: 1,
                        easing: "ease-in-out",
                        delay: 0.5,
                    }}
                >
                    <QrCodeImg id="qr-code" />
                </QrCodeContainer>
            </div>
        </Container>
    )
}
