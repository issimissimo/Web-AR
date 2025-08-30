import { createSignal, createEffect, onMount, For } from 'solid-js';
import { config } from '@js/config';
import { Matrix4 } from 'three';
import { styled } from 'solid-styled-components';

// Main components
import UI from './UI';


import { Context } from '@plugin/common';
import Calibration from '@plugin/calibration';

import PLUGINS_LIST from '@plugin';


// XR
import SceneManager from '@js/sceneManager';

// Context



// export const BlurBackground = styled('div')`
//     background: rgba(68, 68, 68, 0.2);
//     box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
//     backdrop-filter: blur(5px);
//     -webkit-backdrop-filter: blur(7.1px);
//     `






export default function ArSession(props) {

    //#region [constants]
    const [currentView, setCurrentView] = createSignal(null);
    const [referenceMatrix, setReferenceMatrix] = createSignal(new Matrix4());
    const [calibrationCompleted, setCalibrationCompleted] = createSignal(true);
    const [componentsLoaded, setComponentsLoaded] = createSignal([]);
    const [componentsInitializing, setComponentsInitializing] = createSignal(false);
    let _tapEnabled = true;
    let _componentsInitialized = 0;


    //#region [lifeCycle]
    onMount(() => {

        // On TAP on screen
        // event listener
        SceneManager.controller.addEventListener("select", () => {

            // Avoid TAP on DOM elements
            if (!_tapEnabled) {
                _tapEnabled = true;
                return;
            }

            // Call onTap function of all the gamesRunning
            props.games.forEach((el) => el.onTap());
        });


        // Load all the games that are saved 
        // on the current marker
        if (props.marker.games.length > 0) {
            props.marker.games.forEach((el) => {
                console.log("GAME:", el)

                // Load all the components by name
                if (el.enabled) {
                    loadComponent(el.id, el.name, true);


                    
                }
            })
        }
    });


    createEffect(() => {
        console.log("Loaded Games:", props.games)
    })



    //#region [handlers]
    /**
     * Go back
     */
    const handleGoBack = () => {
        removeClickableDomElements();
        props.onBack();
    }



    /**
     * Set the reference Matrix4
     * that will be used to set the relative position
     * of the loaded 3D objects
     */
    const handleCalibrationCompleted = (matrix) => {
        setReferenceMatrix(() => matrix);
        setCalibrationCompleted(() => true);
        console.log("CALIBRATION COMPLETED! Matrix:", referenceMatrix());
        setComponentsInitializing(() => true);
    }


    /**
    * This function is called each time
    * a new Game is mounted,
    * to add it with its functions to gamesRunning of app.jsx
    * (N.B. the gameRunning IS NOT the module that we use here in the return 
    * to display the UI of each module!)
    */
    const handleGameReady = (el) => {
        console.log("GAME READY: ", el)
        props.addGame(el);

        // update the DOM elements that can be clicked
        updateClickableDomElements();
    };


    /**
    * This function is called each time
    * a new Game is totally initialized
    * (so, everything in the game has been loaded and created)
    * to hide the initializing component message
    */
    const handleGameInitialized = () => {
        _componentsInitialized++;
        if (_componentsInitialized === componentsLoaded().length) {
            console.log("all games initialized!")
            setComponentsInitializing(() => false);
        }
    }


    //#region [functions]


    let _clickableDomElements = [];

    function disableTap(e) {
        _tapEnabled = false;
        e.stopPropagation();
    };

    function updateClickableDomElements() {
        removeClickableDomElements();
        _clickableDomElements = document.querySelectorAll('#ar-overlay button, #ar-overlay a, #ar-overlay [data-interactive]');
        _clickableDomElements.forEach(element => {
            element.addEventListener('pointerdown', disableTap);
            element.addEventListener('touchstart', disableTap);
        });
        console.log("clickable DOM elements:", _clickableDomElements)
    };

    function removeClickableDomElements() {
        _clickableDomElements.forEach(element => {
            element.removeEventListener('pointerdown', disableTap);
            element.removeEventListener('touchstart', disableTap);
        });
    };









    /**
     * The view that will be showed
     */
    const renderView = () => {

        if (config.debugOnDesktop) {
            return (
                <UI>

                </UI>
            )
        }
        else {
            return (
                <Calibration
                    planeFound={props.planeFound}
                    setAnimation={props.setAnimation}
                    setReferenceMatrix={(matrix) => handleCalibrationCompleted(matrix)}
                />
            )
        }
    };



    /**
    * Import module (game) on-demand.
    * The module will be added to the return of this function
    * (N.B. the module IS NOT the "gameRunning" that we use here and in app.jsx
    * to access its functions!
    * Each "gameRunning" will be added automatically as loaded
    * with the function "handleGameReady")
    */
    async function loadComponent(componentId, componentName, storedOnDatabase) {
        const module = await import(`../../plugin/${componentName}.jsx`);
        const loadedComponent = {
            id: componentId,
            name: componentName,
            stored: storedOnDatabase,
            component: module.default,
        }
        setComponentsLoaded((prev) => [...prev, loadedComponent]);


        const gameSpecs = PLUGINS_LIST.find(g => g.fileName === componentName);
        console.log(gameSpecs)
    }






    //#region [style]

    const Container = styled('div')`
        /* min-height: 100vh;
        width: 100vw; */
    `;



    //#region [return]

    return (
        <Context.Provider value={{
            onReady: handleGameReady,
            onInitialized: handleGameInitialized,
            appMode: props.appMode,
            userId: props.userId,
            markerId: props.marker.id,

        }}>
            <Container id="arSession">

                {/* <BackButton onClick={handleGoBack} /> */}

                {/* {componentsInitializing() && <h2>LOADING...</h2>} */}

                {/* <Calibration
                    planeFound={props.planeFound}
                    setReferenceMatrix={(matrix) => handleCalibrationCompleted(matrix)}
                />; */}

                {/* {renderView()} */}

                {/* <For each={componentsLoaded()}>
                    {(item) => {
                        const Component = item.component;
                        return <Component id={item.id} stored={item.stored} />;
                    }}
                </For> */}

                {!calibrationCompleted() ? (
                    <Calibration
                        planeFound={props.planeFound}
                        setReferenceMatrix={(matrix) => handleCalibrationCompleted(matrix)}
                    />
                ) : (
                    <>
                        {componentsInitializing() && <h2>INITIALIZING COMPONENTS...</h2>}

                        <For each={componentsLoaded()}>
                            {(item) => {
                                const Component = item.component;
                                return <Component id={item.id} stored={item.stored} />;
                            }}
                        </For>
                    </>
                )}

            </Container>
        </Context.Provider>
    );
}
