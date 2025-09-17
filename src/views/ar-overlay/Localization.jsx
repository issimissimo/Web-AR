import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { config } from '@js/config';
import { styled } from 'solid-styled-components';
import Reticle from '@js/reticle';
import { Matrix4 } from 'three';


const VIEWS = {
    SEARCHING: 'searching',
    TARGETING: 'targeting'
}


export default function Localization(props) {

    const [difficult, setDifficult] = createSignal(false)



    onMount(() => {
        // Reticle.set({
        //     fileName: 'models/gizmo.glb'
        // });
        console.log("***Localitazion mounted***")
    });



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



    let timeout = null;


    return (
        <div>
            {props.planeFound ?
                <div>
                    FOUND!
                </div>
                :
                <div>
                    LOOK...
                </div>
            }

            <button
                onClick={handleOnDone}
            >DONE</button>
        </div>
    );
}
