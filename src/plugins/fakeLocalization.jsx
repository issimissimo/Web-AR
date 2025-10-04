import { onMount, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';


export default function fakeLocalization(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("fakeLocalization", props.id, {

        onTap: () => {
        },

        renderLoop: () => loop()

    });


    /*
    * On mount
    */
    onMount(() => {


        /*
        * Don't forget to call "game.setInitialized()" at finish 
        */
        // console.log("ADESSO CHIAMO SET INITIALIZED PER basicCube !!!!!")
        game.setInitialized()

    });


    createEffect(() => {
        if (props.enabled) {
            console.log("CIAAAAAAAAAAOOOOOOOOOO SONO FAAAAAAAKKE E SONO ENABLED")
        }

    })




    /*
    * LOOP
    */
    function loop() { }



    const renderView = () => {
        return (
            <>
                {
                    props.selected && (
                        <>
                            CIAO FAKE!
                        </>
                    )
                }
            </>
        )
    }
    // Delegate mounting to the shared game hook
    game.mountView(renderView);
}