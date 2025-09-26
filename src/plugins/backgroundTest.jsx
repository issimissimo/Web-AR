import { onMount, createEffect } from 'solid-js';
import { useGame } from '@js/gameBase';
import { MeshStandardMaterial, Mesh } from 'three';
import * as THREE from "three";
import { LoadTexture } from '@tools/three/textureTools';

export default function backgroundTest(props) {

    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("backgroundTest", props.id, {

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
    //     console.log("basicCube __ selected:", props.selected)
    // })


    /*
    * SETUP SCENE
    */
    let plane;
    async function setupScene() {
        const map = await new LoadTexture("images/foto.jpg", {flipY: false});

        const planeGeometry = new THREE.PlaneGeometry(1, 1.4);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: map
        });
        plane = new Mesh(planeGeometry, planeMaterial);
        plane.position.set(0, 0, -1);
        game.addToScene(plane);


        /*
        * Don't forget to call "game.setInitialized()" at finish 
        */
        // console.log("ADESSO CHIAMO SET INITIALIZED PER basicCube !!!!!")
        game.setInitialized()
    }


    /*
    * LOOP
    */
    function loop() { }


    const renderView = () => {
        return (
            <>
            </>
        )
    }
    // Delegate mounting to the shared game hook
    game.mountView(renderView);
}