import { onMount, createEffect, on } from "solid-js"
import { useGame } from "@js/gameBase"
import { MeshStandardMaterial, Mesh } from "three"
import * as THREE from "three"
import useOnce from "@hooks/SolidJS/useOnce"

import Toast from "@components/Toast"

export default function basicCube(props) {
    let messageRef
    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("basicCube", props.id, {
        onTap: () => {},

        // renderLoop: () => loop(),

        onLowTracking: () => {
            console.warn("STO BYPASSANDO LOW TRACKING DA BASIC CUBE...")
            game.handleShowToast(
                "STO BYPASSANDO LOW TRACKING DA BASIC CUBE...",
                {
                    infinite: true,
                },
            )
        },

        onNormalTracking: () => {
            console.log("STO BYPASSANDO NORMAL TRACKING DA BASIC CUBE...")
            game.handleHideToast()
        },
    })

    /*
     * On mount
     */
    onMount(() => {
        setupScene()
    })

    // createEffect(() => {
    //     console.log("basicCube __ selected:", props.selected)
    // })

    /*
     * SETUP SCENE
     */
    let cube
    function setupScene() {
        // console.log("***** basicCube - setup")
        const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
        const cubeMaterial = new MeshStandardMaterial({ color: 0x00ff00 })
        cube = new Mesh(cubeGeometry, cubeMaterial)
        cube.position.set(0, 0, -0.5)
        game.addToScene(cube)

        /*
         * Don't forget to call "game.setInitialized()" at finish
         */
        game.setInitialized()

        setTimeout(() => {
            messageRef.show("SUCAAAAAAAAAA", {
                    infinite: true,
                },)
        }, 2000)
    }

    /*
     * LOOP
     */
    function loop() {}

    // createEffect(on(() => props.enabled, (enabled) => {
    //     if (enabled) {
    //         console.log("IL CUBO E' ENABLED!!!!!!!!!!!!!")
    //     }
    // }))

    useOnce(
        () => props.enabled,
        () => {
            console.log("IL CUBO E' ENABLED!!!!!!!!!!!!!")
        },
    )

    // const renderView = () => {
    //     return <>{props.selected && <>CIAO SONO IL CUBO!</>}</>
    // }

    const renderView = () => {
        return (
            <>
                <Toast ref={messageRef} />
            </>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
