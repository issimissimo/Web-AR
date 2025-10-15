import { onMount, createSignal, useContext } from "solid-js"
import { Motion } from "solid-motionone"
import { styled } from "solid-styled-components"
import Reticle from "@js/reticle"
import { config } from "@js/config"
import { Matrix4 } from "three"
import { Centered } from "@components/smallElements"
import Message from "@components/Message"
import Button from "@components/Button"
import { faCheck, faQrcode } from "@fortawesome/free-solid-svg-icons"
import { Context } from "@views/ar-overlay/arSession"

export default function Localization(props) {
    const [showInstructions, setShowInstructions] = createSignal(true)
    const context = useContext(Context)

    onMount(() => {
        Reticle.setSurfType(Reticle.SURF_TYPE_MODE.ALL)
        Reticle.setup(Reticle.MESH_TYPE.PLANE, {
            size: 0.2,
            texturePath: "images/qr-code.webp",
            color: 0xf472b6,
        })
        context.handleBlurredCover({
            visible: true,
            showHole: false,
            priority: 9999,
        })
    })

    const handleCloseInstructions = () => {
        console.log("Chiudo istruzioni e setto Rericle visible!")
        setShowInstructions(false)
        Reticle.setVisible(true)
        context.handleBlurredCover({
            visible: true,
            showHole: true,
        })
    }

    const handleOnDone = () => {
        if (config.debugOnDesktop) {
            console.warn(
                "Siccome siamo in debug su desktop terminiamo la calibrazione senza un reale ancoraggio"
            )
            const fakeHitMatrix = new Matrix4()
            props.setReferenceMatrix(fakeHitMatrix)
        } else {
            //
            // Here we set the reference Matrix!
            //
            const matrix = Reticle.getHitMatrix()
            props.setReferenceMatrix(matrix)
        }
        context.handleBlurredCover({
            visible: false,
            priority: 0,
        })
    }

    /*
     * STYLE
     */

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
        pointer-events: none;
    `

    const DoneContainer = styled(Motion.div)`
        width: 100%;
        height: 50vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        margin-top: -35px;
    `

    const DoneCentralButton = styled("button")`
        width: 150px;
        height: 150px;
        outline: none;
        border: none;
        -webkit-tap-highlight-color: transparent;
        background: transparent;
        &:focus {
            outline: none;
        }
    `

    return (
        <Container>
            {showInstructions() ? (
                <Message
                    style={{ height: "auto" }}
                    icon={faQrcode}
                    showReadMore={false}
                    showDoneButton={true}
                    onDone={handleCloseInstructions}
                >
                    La tua esperienza in AR richiede che ti localizzi!<br></br>
                    Mettiti di fronte al QR-Code e inquadralo, per localizzarti
                    nell'ambiente circostante<br></br>
                    Cerca di essere il più preciso possibile!<br></br>
                    Io non posso ancora sapere quando lo avrai al centro dello
                    schermo
                </Message>
            ) : (
                <DoneContainer
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: 0.5,
                        easing: "ease-in-out",
                        delay: 0,
                    }}
                >
                    Allinea il QR-Code
                    <DoneCentralButton onClick={handleOnDone} />
                    <Button
                        onClick={handleOnDone}
                        small={true}
                        visible={
                            config.debugOnDesktop ? true : props.planeFound
                        }
                        active={config.debugOnDesktop ? true : props.planeFound}
                        icon={faCheck}
                        width={"65%"}
                    >
                        Fatto!
                    </Button>
                </DoneContainer>
            )}
        </Container>
    )
}
