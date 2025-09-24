import { onMount, createEffect, onCleanup } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { BoxGeometry, MeshStandardMaterial, Mesh, HemisphereLight, Vector3 } from 'three';
import Reticle from '@js/reticle';
import { render } from 'solid-js/web';

import ContactShadowsXR from '@tools/three/contactShadowsXR';
import SceneManager from '@js/sceneManager';



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
    let cube, shadows;
    function setupScene() {

        console.log("***** basicRotCube - setup")
        // Reticle.setEnabled(false);

        // const cubeGeometry = new BoxGeometry(0.2, 0.2, 0.2);
        const cubeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const cubeMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        cube = new Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, -0.5, -1);
        game.addToScene(cube);


        // const light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
        // light.position.set(0, 2, 0);
        // game.addToScene(light);


        // shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer, {
        //     position: new Vector3(0, -1, -1),
        //     resolution: 512,
        //     blur: 2,
        //     animate: true,
        //     updateFrequency: 2,
        // });

        /*
        * Don't forget to call "game.setInitialized()" at finish 
        */
        console.log("ADESSO CHIAMO SET INITIALIZED PER ROT CUBE!!!!!")
        game.setInitialized()
    }


    /*
    * LOOP
    */
    function loop() {
        // cube.rotation.x += 0.01;
        // cube.rotation.y += 0.01;

        // shadows.update();
    }




    /*
    * STYLE
    */
    const Container = styled('div')`
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2em;
    `
    const Title = styled('h2')`
        text-align: center;
    `

    const Description = styled('p')`
        text-align: center;
    `

    const Button = styled('button')`
        margin: 1em;
    `



    /*
    * RENDER (Will be shown ONLY after initialization completed)
    */

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
        const el = game.mountEl();
        if (!el) {
            console.error("NO EL!")
            return;
        }
        if (_disposer) {
            console.error("ALREADY DISPOSER")
            return;
        }

        // Use the reusable renderView function to keep JSX in one place
        _disposer = render(renderView, el);
    });

    // Ensure we dispose the programmatic render when this component unmounts
    onCleanup(() => {
        if (_disposer) _disposer = null;
    });

}