import { createSignal, createEffect, createContext, onMount, For } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { config } from '@js/config';
import { Matrix4 } from 'three';
import { styled } from 'solid-styled-components';

// Main components
import MainUI from './MainUI';
import Localization from './Localization';
import Inventory from './Inventory';

import Header from '@components/Header';
import Loader from '@components/Loader';
import BlurredCover from '@components/BlurredCover';
import { Container, Centered } from '@components/smallElements'





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
    const [localizationState, setLocalizationState] = createSignal(LOCALIZATION_STATE.NONE);
    const [referenceMatrix, setReferenceMatrix] = createSignal(new Matrix4());
    const [loading, setLoading] = createSignal(true);
    const [modules, setModules] = createSignal([]);
    const [gamesInitializing, setGamesInitializing] = createSignal(false);
    const [selectedGameId, setSelectedGameId] = createSignal(null);
    const [blurVisible, setBlurVisible] = createSignal(false);

    let _tapEnabled = true;
    let _gamesInitialized = 0;


    //#region [lifeCycle]
    onMount(() => {

        if (config.debugOnDesktop) {
            document.getElementsByTagName("body")[0].style.backgroundColor = "black"
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
        else setLoading(() => false);
    });


    createEffect(() => {
        console.log("---- Games running:", props.gamesRunning)
        // console.log("---- Games imported:", gamesImported());
        console.log("---- Game id selected:", selectedGameId());
        // console.log("---- Games initializing:", gamesInitializing());
    })


    /**
    * Load all the games (as bundles) of the marker.
    * In this way we keep the main bundle as small as possible!
    */
    async function loadAllModules() {
        if (props.marker.games, length > 0) {

            for (const el of props.marker.games) {
                if (el.enabled) {
                    // load dynamically the module
                    setGamesInitializing(() => true);
                    await loadModule(el.id, el.name, true);
                }
            }
        }
        setLoading(() => false);
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

        setLocalizationState(() => LOCALIZATION_STATE.COMPLETED);
        console.log("LOCALIZATION COMPLETED! Matrix:", referenceMatrix());

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

        if (_gamesInitialized === modules().length) {
            console.log("all games initialized!")
            setGamesInitializing(() => false);


            // If just one of the game need localization,
            // we need to show the Localization component
            // as soon as all the games initialized

            for (let i = 0; i < props.gamesRunning.length; i++) {
                const _game = props.gamesRunning[i];

                const gameSpecs = PLUGINS_LIST.find(g => g.fileName === _game.name);
                if (gameSpecs.localized && localizationState() !== LOCALIZATION_STATE.COMPLETED) {

                    // Hide all the meshes of all the games
                    setGamesVisible(false);
                    // Show the Localization view
                    setLocalizationState(() => LOCALIZATION_STATE.REQUIRED);

                    break;
                }
            }
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
    async function loadModule(moduleId, moduleName, storedOnDatabase, selectOnEnd = false) {
        const raw = await import(`../../plugins/${moduleName}.jsx`);
        const newModule = {
            id: moduleId,
            name: moduleName,
            stored: storedOnDatabase,
            component: raw.default,
        }
        setModules((prev) => [...prev, newModule]);

        // Select the new game created
        if (selectOnEnd) {
            setSelectedGameId(moduleId);
        }
    }


    const handleSetBlurVisible = (inventoryVisible) => {
        // TODO - gestire anche Localization!
        setBlurVisible(() => inventoryVisible);
    }

    const handleBlurBackground = (value) => {
        setBlurVisible(() => value);
    }


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
            referenceMatrix: referenceMatrix(),
            localizationCompleted: () => localizationState() === LOCALIZATION_STATE.COMPLETED,
            blurBackground: (value) => handleBlurBackground(value)
        }}>
            <Main id="arSession">

                <BlurredCover direction={blurVisible() ? "in" : "out"} />

                {/* HEADER */}
                <Header
                    showUser={false}
                    onClickBack={handleGoBack}
                />

                {
                    loading() ? (<Loader />)
                        :
                        <>
                            {gamesInitializing() && <Loader text="Inizializzo" />}

                            <For each={modules()}>
                                {item => {
                                    const Component = item.component;
                                    return <Component
                                        id={item.id}
                                        stored={item.stored}
                                        selected={item.id === selectedGameId() &&
                                            localizationState() !== LOCALIZATION_STATE.REQUIRED ?
                                            true : false}
                                    />;
                                }}
                            </For>

                            {!gamesInitializing() && (
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
                                        onToggleUi={(showed) => handleSetBlurVisible(showed)}
                                    />
                            )}
                        </>
                }
            </Main>
        </Context.Provider>
    );
}
