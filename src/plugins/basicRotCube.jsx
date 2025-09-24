import { onMount, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';
import { MeshStandardMaterial, Mesh } from 'three';
import { render } from 'solid-js/web';



import * as THREE from "three";




export default function basicRotCube(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("basicRotCube", props.id, {

        onTap: () => {
        },

        renderLoop: () => loop()

    });


    /*
    * DATA
    */


    let _disposer = null;

    /*
    * On mount
    */
    onMount(() => {
        setupScene();
    });

    createEffect(() => {
        console.log("BASIC ROT CUBE __ selected:", props.selected)
    })


    /*
    * SETUP SCENE
    */
    let cube;
    function setupScene() {

        console.log("***** basicRotCube - setup")
        // Reticle.setEnabled(false);

        // const cubeGeometry = new BoxGeometry(0.2, 0.2, 0.2);
        const cubeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const cubeMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        cube = new Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, -0.5, -1);
        game.addToScene(cube);


        /*
        * Don't forget to call "game.setInitialized()" at finish 
        */
        console.log("ADESSO CHIAMO SET INITIALIZED PER ROT CUBE!!!!!")
        game.setInitialized()
    }


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
                            CIAO SONO IL CUBO!
                        </>
                    )
                }
            </>
        )
    }


    createEffect(() => {
        if (!game.mountEl() || _disposer) return;
        _disposer = render(renderView, game.mountEl());
    });

}