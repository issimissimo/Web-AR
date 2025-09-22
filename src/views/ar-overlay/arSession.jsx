import { createSignal, createEffect, createContext, onMount, For } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { config } from '@js/config';
import { Matrix4 } from 'three';
import { styled } from 'solid-styled-components';

// Main components
import InitialDetection from './InitialDetection';
import Localization from './Localization';
import Inventory from './Inventory';
import Header from './Header';
import BlurredCover from './BlurredCover';

import Loader from '@components/Loader';

import { PLUGINS_LIST } from '@plugins/pluginsIndex';
import { AppMode } from '@/main';

// XR
import SceneManager from '@js/sceneManager';
import Reticle from '@js/reticle';

// ===== CONTEXT =====
export const Context = createContext();


const LOCALIZATION_STATE = {
    NONE: 'none',
    REQUIRED: 'required',
    COMPLETED: 'completed'
}


export default function ArSession(props) {

    //#region [constants]
    const firebase = useFirebase();
    const [initDetectionCompleted, setInitDetectionCompleted] = createSignal(false);
    const [localizationState, setLocalizationState] = createSignal(LOCALIZATION_STATE.NONE);
    const [referenceMatrix, setReferenceMatrix] = createSignal(new Matrix4());
    const [loading, setLoading] = createSignal(true);
    const [modules, setModules] = createSignal([]);
    const [gamesInitialized, setGamesInitialized] = createSignal(false);
    const [gamesEnabled, setGamesEnabled] = createSignal(false);
    const [selectedGameId, setSelectedGameId] = createSignal(null);

    // Blurred cover
    const [blurVisible, setBlurVisible] = createSignal(false);
    const [blurShowHole, setBlurShowHole] = createSignal(false);

    let _tapEnabled = true;
    let _gamesInitialized = 0;


    //#region [lifeCycle]
    onMount(() => {

        // Let's start immediately darkening the background...
        // setBlurVisible(true);
        handleBlurredCover({ visible: true });

        // ...and Starting the Reticle, to detect the space around us.
        // We start the Reticle here, and not in the games, because
        // we want the 1st detection to be as quick as possible!
        Reticle.setup(Reticle.MESH_TYPE.RINGS,
            {
                size: 0.4,
                ringNumber: 4,
                ringThickness: 0.2,
                color: 0xf472b6,
            });

        // // We don't want to show the Reticle now!
        // Reticle.setVisible(false);

        // When reopening the ARSession it seem to stay "true"... 
        // let's force (not clear why I have to do that)
        setInitDetectionCompleted(false);

        console.log("initDetectionCompleted:", initDetectionCompleted())

        // If Debug on desktop we must set the background 
        // to black, so to see something...
        const body = document.getElementsByTagName("body")[0];
        if (config.debugOnDesktop) {
            body.style.backgroundColor = "black";

            // Skip init detection
            setInitDetectionCompleted(true);
            console.warn("We are DEBUGGING on desktop and Init detection is skipped!");
        }
        // If not, we must set it to transparent for compatibility on iOS
        else {
            body.style.backgroundColor = "transparent"
        }

        // if we are "user" we must update the views number
        // of this marker (+1)
        if (props.appMode === AppMode.LOAD) {
            firebase.firestore.updateMarkerViews(props.userId, props.marker.id);
        }

        // On TAP on screen
        // event listener
        SceneManager.controller.addEventListener("select", () => {

            // Avoid TAP on DOM elements
            if (!_tapEnabled) {
                _tapEnabled = true;
                return;
            }

            // Call onTap function of all the gamesRunning
            props.gamesRunning.forEach((el) => el.onTap());
        });

        // Load games of this marker
        if (props.marker.games.length > 0) {
            loadAllModules();
        }
        else {
            setLoading(() => false);
        }
    });


    createEffect(() => {
        // console.log("---- Games running:", props.gamesRunning)
        // // console.log("---- Games imported:", gamesImported());
        // console.log("---- Game id selected:", selectedGameId());

        // console.log(">>>>>localizationState:", localizationState())
        // // console.log("---- Games initializing:", gamesInitializing());
        // console.log("AAAAHHHH:", referenceMatrix())
        if (gamesInitialized() && initDetectionCompleted() &&
            localizationState() !== LOCALIZATION_STATE.REQUIRED) {
            console.log("------------ ADESSO SONO ENABLED!")
            setGamesEnabled(true);
        }
    })

    createEffect(() => {
        console.log("---- Games running:", props.gamesRunning)
        // // console.log("---- Games imported:", gamesImported());

    })



    /** As soon as the Reticle find a surface
    * we want to hide the "InitDetection" component
    * and set prop "enabled={true}" on the games
    */
    createEffect(() => {
        if (props.planeFound) {
            setInitDetectionCompleted(() => true);
        }
    })

    createEffect(() => {
        console.log("UEEE GUARDA INIT DETECTION!!!...", initDetectionCompleted())
    })


    /**
    * Load all the games (as bundles) of the marker.
    * In this way we keep the main bundle as small as possible!
    */
    function loadAllModules() {
        for (const el of props.marker.games) {
            if (el.enabled) {

                // load dynamically the module
                // await loadModule(el.id, el.name);
                loadModule(el.id, el.name);
            }
        }
        // setLoading(() => false);
    }


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
    const handleLocalizationCompleted = (matrix) => {
        setReferenceMatrix(() => matrix);

        // Show all the meshes of all the games
        setGamesVisible(true);

        console.log("LOCALIZATION COMPLETED! Matrix:", referenceMatrix());
        setLocalizationState(() => LOCALIZATION_STATE.COMPLETED);
    }


    /**
    * This function is called each time
    * a new module is mounted,
    * to add it with its functions to gamesRunning of app.jsx
    * (N.B. the gameRunning IS NOT the module that we use here in the return 
    * to display the UI of each module!)
    */
    const handleModuleLoaded = (el) => {
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

        _gamesInitialized++;

        checkAllGamesReady();

        // // When all games have finished to load their assets...
        // if (_gamesInitialized === modules().length) {

        //     // Here before to proceed WE MUST WAIT for all props.gamesRunning
        //     // are set too, because it can happen that are intialized BEFORE that are set!!!




        //     console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")


        //     console.log("all games initialized!")
        //     setGamesInitialized(true);

        //     // it should not be necessary here... :/
        //     updateClickableDomElements();


        //     console.log("props.gamesRunning", props.gamesRunning)


        //     // If just one of the game need localization,
        //     // we need to show the Localization component
        //     // as soon as all the games initialized

        //     for (let i = 0; i < props.gamesRunning.length; i++) {



        //         const _game = props.gamesRunning[i];

        //         const gameSpecs = PLUGINS_LIST.find(g => g.fileName === _game.name);
        //         if (gameSpecs.localized && localizationState() !== LOCALIZATION_STATE.COMPLETED) {

        //             console.log("============= ", _game.name, "RICHIEDE LOCALIZZAZIONE!!")

        //             // Hide all the meshes of all the games
        //             setGamesVisible(false);
        //             // Show the Localization view
        //             setLocalizationState(() => LOCALIZATION_STATE.REQUIRED);

        //             break;
        //         }
        //         else{
        //             console.log("============= ", _game.name, "NON RICHIEDE LOCALIZZAZIONE...")
        //         }
        //     }

        //     console.log("OOOOOOOOOOOOOOOOOOOOOO --------------   OOOOOOOOOOOOOOOOOO")
        // }
    }


    const checkAllGamesReady = () => {

        // When all games have finished to load their assets
        // AND all props.gamesRunning are set
        // (I need to check props.gamesRunning too because if initialization
        // is too quick often the game it's not yet set in props.gamesRunning...!)
        if (_gamesInitialized === modules().length &&
            props.gamesRunning.length === modules().length) {

            console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")


            console.log("all games initialized and set!")
            setGamesInitialized(true);

            // it should not be necessary here... :/
            updateClickableDomElements();


            console.log("props.gamesRunning", props.gamesRunning)


            // If just one of the game need localization,
            // we need to show the Localization component
            // as soon as all the games initialized

            for (let i = 0; i < props.gamesRunning.length; i++) {



                const _game = props.gamesRunning[i];

                const gameSpecs = PLUGINS_LIST.find(g => g.fileName === _game.name);
                if (gameSpecs.localized && localizationState() !== LOCALIZATION_STATE.COMPLETED) {

                    console.log("============= ", _game.name, "RICHIEDE LOCALIZZAZIONE!!")

                    // Hide all the meshes of all the games
                    setGamesVisible(false);
                    // Show the Localization view
                    setLocalizationState(() => LOCALIZATION_STATE.REQUIRED);

                    break;
                }
                else {
                    console.log("============= ", _game.name, "NON RICHIEDE LOCALIZZAZIONE...")
                }
            }

            console.log("OOOOOOOOOOOOOOOOOOOOOO --------------   OOOOOOOOOOOOOOOOOO")
        }
    }


    //#region [functions]


    /**
    * This function is called when all games are initialized,
    * but, since it's very unpredictable yo know the interactable DOM elements
    * on the page, it should be called also when something on the page change
    */
    let _clickableDomElements = [];
    function updateClickableDomElements() {
        removeClickableDomElements();
        _clickableDomElements = document.querySelectorAll('#ar-overlay button, #ar-overlay a, #ar-overlay [data-interactive]');
        _clickableDomElements.forEach(element => {
            // Use passive listeners for touch/pointer to avoid scroll-blocking warnings
            element.addEventListener('pointerdown', disableTap, { passive: true });
            element.addEventListener('touchstart', disableTap, { passive: true });
        });
        console.log("clickable DOM elements:", _clickableDomElements)
    };
    function removeClickableDomElements() {
        _clickableDomElements.forEach(element => {
            // remove with same capture option (passive doesn't affect removal but keep options explicit)
            element.removeEventListener('pointerdown', disableTap, { passive: true });
            element.removeEventListener('touchstart', disableTap, { passive: true });
        });
    };
    function disableTap(e) {
        _tapEnabled = false;
        e.stopPropagation();
    };



    /**
    * Hide (or show) all the objects inside all the games,
    * or inside a specific game
    */
    const setGamesVisible = (value, gameName = null) => {
        props.gamesRunning.forEach(el => {
            // only one game
            if (gameName) {
                if (el.name === gameName) el.setVisible(value);
            }
            // all games
            else {
                el.setVisible(value);
            }
        });
    }




    const handleSaveSelectedGame = async () => {

        const gameToSave = props.gamesRunning.find((el) => el.id === selectedGameId());
        setSelectedGameId(null);

        console.log("GAME TO SAVE:", gameToSave);
        console.log("GAME DATA TO SAVE:", gameToSave.gameData());

        const newGameId = await firebase.firestore.addGame(props.userId, props.marker.id, gameToSave.name);
        console.log('Creato in Firestore il game con ID:', newGameId)

        if (gameToSave.gameData()) {
            try {
                const path = `${props.userId}/markers/${props.marker.id}/games/${newGameId}`;
                await firebase.realtimeDb.saveData(path, gameToSave.gameData());
                console.log('Creato in RealtimeDB il JSON con ID:', newGameId)

            } catch (error) {
                console.log("Errore nel salvataggio JSON:", error);
            }
        }

        props.onNewGameSaved();
    }



    /**
    * Import module (game) on-demand.
    * The module will be added to the return of this function
    * (N.B. the module IS NOT the "gameRunning" that we use here and in app.jsx
    * to access its functions!
    * Each "gameRunning" will be added automatically as loaded
    * with the function "handleModuleLoaded")
    */
    async function loadModule(moduleId, moduleName, selectOnEnd = false) {
        console.log("LOADING:", moduleName)
        const raw = await import(`../../plugins/${moduleName}.jsx`);
        const newModule = {
            id: moduleId,
            name: moduleName,
            component: raw.default,
        }
        setModules((prev) => [...prev, newModule]);

        // Select the new game created
        if (selectOnEnd) {
            setSelectedGameId(moduleId);
        }
    }



    const handleBlurredCover = (state = {}) => {

        // TODO: gestire chiamate multiple incoerenti da script diversi...


        const priority = state.priority ?? 0;



        setBlurVisible(() => state.visible ?? blurVisible());
        setBlurShowHole(() => state.showHole ?? blurShowHole());

        // Reset
        if (!blurVisible() && blurShowHole()) {
            setTimeout(() => {
                console.log("RESET")
                setBlurShowHole(false);
            }, 1000);
        }
    }




    //#region [style]

    const Main = styled('div')`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding: 1.5em;
          box-sizing: border-box;
        `;







    //#region [return]

    return (
        <Context.Provider value={{
            onLoaded: handleModuleLoaded,
            onInitialized: handleGameInitialized,
            appMode: props.appMode,
            userId: props.userId,
            markerId: props.marker.id,
            handleBlurredCover: (state) => handleBlurredCover(state),
            forceUpdateDomElements: updateClickableDomElements
        }}>
            <Main id="arSession">

                <BlurredCover
                    visible={blurVisible()}
                    showHole={blurShowHole()}
                    planeFound={props.planeFound}
                />

                {/* HEADER */}
                <Header
                    onClickBack={handleGoBack}
                />

                {
                    loading() ? (<Loader />)
                        :
                        <>
                            {!gamesInitialized() && <Loader text="Inizializzo" />}


                            {/* GAMES */}
                            <For each={modules()}>
                                {item => {
                                    const Component = item.component;
                                    return <Component
                                        id={item.id}
                                        enabled={gamesEnabled()}
                                        selected={gamesEnabled() && item.id === selectedGameId()}
                                        referenceMatrix={referenceMatrix()}
                                    />;
                                }}
                            </For>


                            {gamesInitialized() && (

                                !initDetectionCompleted() ?

                                    <InitialDetection />

                                    :

                                    localizationState() === LOCALIZATION_STATE.REQUIRED ?

                                        <Localization
                                            planeFound={props.planeFound}
                                            setReferenceMatrix={(matrix) => handleLocalizationCompleted(matrix)}
                                        />

                                        :

                                        props.appMode === AppMode.SAVE &&

                                        <Inventory
                                            marker={props.marker}
                                            addNewModule={(id, name) => loadModule(id, name, false, true)}
                                            saveEnabled={selectedGameId() !== null ? true : false}
                                            saveGame={handleSaveSelectedGame}
                                        />
                            )}
                        </>
                }
            </Main>
        </Context.Provider>
    );
}
