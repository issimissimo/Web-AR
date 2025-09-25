import { onMount, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';
import { MeshStandardMaterial, Mesh } from 'three';
import * as THREE from "three";


export default function basicSphere(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("basicSphere", props.id, {

        onTap: () => {
        },

        renderLoop: () => loop()

    });


    /*
    * On mount
    */
    onMount(() => {
        setupScene();
    });

    // createEffect(() => {
    //     console.log("basicSphere __ selected:", props.selected)
    // })


    /*
    * SETUP SCENE
    */
    let sphere;
    function setupScene() {

        // console.log("***** basicSphere - setup")
        const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const sphereMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        sphere = new Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, -0.5, -1);
        game.addToScene(sphere);


        /*
        * Don't forget to call "game.setInitialized()" at finish 
        */
        // console.log("ADESSO CHIAMO SET INITIALIZED PER basicSphere !!!!!")
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
                            CIAO SONO LA SFERA!
                        </>
                    )
                }
            </>
        )
    }
    // Delegate mounting to the shared game hook
    game.mountView(renderView);
}