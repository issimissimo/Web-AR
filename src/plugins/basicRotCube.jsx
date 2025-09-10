import { onMount } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { BoxGeometry, MeshStandardMaterial, Mesh, HemisphereLight, Vector3 } from 'three';
import Reticle from '@js/reticle';

import ContactShadowsXR from '@tools/three/contactShadowsXR';
import SceneManager from '@js/sceneManager';


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



    /*
    * On mount
    */
    onMount(() => {
        setupScene();
    });


    /*
    * SETUP SCENE
    */
    let cube, shadows;
    function setupScene() {

        console.log("SETUP!")
        Reticle.setEnabled(false);

        const cubeGeometry = new BoxGeometry(0.5, 0.5, 0.5);
        const cubeMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        cube = new Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, -0.5, -1);
        game.addToScene(cube);


        const light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0, 2, 0);
        game.addToScene(light);


        shadows = new ContactShadowsXR(SceneManager.scene, SceneManager.renderer, {
            position: new Vector3(0, -1, -1),
            resolution: 512,
            blur: 2,
            animate: true,
            updateFrequency: 2,
        });

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)
    }


    /*
    * LOOP
    */
    function loop() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        shadows.update();
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
    * RENDER
    */
    return (
        props.selected ?

            <Container>
                <Title>{game.gameDetails.title}</Title>
                <Description>{game.gameDetails.description}</Description>
                {/* <Button
                    onClick={() => game.saveGame()}
                >Test salva game</Button> */}
            </Container>

            :
            <div />
    );

}