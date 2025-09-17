import { onMount, onCleanup, createEffect, createSignal, useContext } from 'solid-js';
import { config } from '@js/config';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';
import { Matrix4 } from 'three';
import Message from '@components/Message';
import { Centered } from '@components/smallElements';
import { Context } from '@views/ar-overlay/arSession';
import Button from '@components/Button';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';
import { faCheck } from "@fortawesome/free-solid-svg-icons";


export default function Localization(props) {

    const [showInstructions, setShowInstructions] = createSignal(true);
    const context = useContext(Context);


    onMount(() => {
        // Reticle.set({
        //     fileName: 'models/gizmo.glb'
        // });
        console.log("***Localitazion mounted***")
    });


    const handleCloseInstructions = () => {
        setShowInstructions(false);

        // Reticle.setVisible(true);
        // game.handleBlurredCover({ visible: false });
        // game.forceUpdateDomElements();

        context.handleBlurredCover({ showHole: true });
    }



    const handleOnDone = () => {
        if (config.debugOnDesktop) {
            console.warn("Siccome siamo in debug su desktop terminiamo la calibrazione senza un reale ancoraggio");
            const fakeHitMatrix = new Matrix4();
            props.setReferenceMatrix(fakeHitMatrix);
        }
        else {
            if (props.planeFound) {
                props.setReferenceMatrix(Reticle.getHitMatrix());
            }
        }
    }



    /*
    * STYLE
    */
    const AAA = styled(Motion.div)`
        width: 100%;
        height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
    `



    // return (
    //     <div>
    //         {props.planeFound ?
    //             <div>
    //                 FOUND!
    //             </div>
    //             :
    //             <div>
    //                 LOOK...
    //             </div>
    //         }

    //         <button
    //             onClick={handleOnDone}
    //         >DONE</button>
    //     </div>
    // );
    return (
        <Centered>
            {
                showInstructions() ?

                    <Message
                        style={{ "height": "auto" }}
                        svgIcon={'icons/phone.svg'}
                        showReadMore={false}
                        showDoneButton={true}
                        onDone={handleCloseInstructions}
                    >
                        Per permettermi di localizzarti nell'ambiente circostante dovrai inquadrare il QR-Code di riferimento.<br></br>
                        Cerca di essere il più preciso possibile!
                    </Message>

                    :

                    <AAA>
                        Inquadra il QR-Code
                        <Button
                            onClick={handleOnDone}
                            small={true}
                            active={config.debugOnDesktop ? true : props.planeFound}
                            icon={faCheck}
                            width={"65%"}
                        >
                            Fatto!
                        </Button>
                    </AAA>

            }
        </Centered>
    );
}
