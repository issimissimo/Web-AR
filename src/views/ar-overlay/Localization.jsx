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
        Reticle.setup(Reticle.MESH_TYPE.PLANE, {
            size: 0.2,
            texturePath: "images/qr-code.webp",
            color: 0xf472b6,
        })
        console.log("Localization OnMount")
        context.forceUpdateDomElements();
    })

    const handleCloseInstructions = () => {
        setShowInstructions(false)
        Reticle.setVisible(true)
        context.handleBlurredCover({ showHole: true });
        context.forceUpdateDomElements();
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
        context.handleBlurredCover({ visible: false })
    }

    /*
     * STYLE
     */
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
        /* &:active {
            background: ${(props) =>
            props.grey
                ? "var(--color-grey-dark)"
                : "var(--color-primary-dark)"};
            color: var(--color-background);
            border-color: ${(props) =>
            props.grey ? "var(--color-grey)" : "var(--color-primary)"};
        } */
    `

    return (
        <Centered>
            {showInstructions() ? (
                <Message
                    style={{ height: "auto" }}
                    icon={faQrcode}
                    // svgIcon={"icons/phone.svg"}
                    showReadMore={false}
                    showDoneButton={true}
                    onDone={handleCloseInstructions}
                >
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
                    <DoneCentralButton
                        onClick={handleOnDone}
                    />
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
        </Centered>
    )
}
