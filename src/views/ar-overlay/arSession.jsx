import {
    createSignal,
    createEffect,
    createContext,
    onMount,
    onCleanup,
    For,
    createRoot,
    on,
} from "solid-js"
import { useFirebase } from "@hooks/useFirebase"
import { config } from "@js/config"
import { Matrix4 } from "three"
import { styled } from "solid-styled-components"

// Main components
import InitialDetection from "./InitialDetection"
import Localization from "./Localization"
import UI from "./UI"
import Header from "./Header"
import BlurredCover from "./BlurredCover"

import Loader from "@components/Loader"

import { PLUGINS_LIST } from "@plugins/pluginsIndex"
import { AppMode } from "@/main"

// XR
import SceneManager from "@js/sceneManager"
import Reticle from "@js/reticle"

// ===== CONTEXT =====
export const Context = createContext()

const LOCALIZATION_STATE = {
    NONE: "none",
    REQUIRED: "required",
    COMPLETED: "completed",
}

export default function ArSession(props) {
    //#region [constants]
    const firebase = useFirebase()
    const [initDetectionCompleted, setInitDetectionCompleted] =
        createSignal(false)
    const [localizationState, setLocalizationState] = createSignal(
        LOCALIZATION_STATE.NONE
    )
    const [referenceMatrix, setReferenceMatrix] = createSignal(new Matrix4())
    const [modules, setModules] = createSignal([])
    const [gamesInitialized, setGamesInitialized] = createSignal(false)
    const [gamesEnabled, setGamesEnabled] = createSignal(false)
    const [selectedGameId, setSelectedGameId] = createSignal(null)
    const [headerText, setHeaderText] = createSignal("");

    // Blurred cover
    const [blurVisible, setBlurVisible] = createSignal(false)
    const [blurShowHole, setBlurShowHole] = createSignal(false)
    const _blurredCoverStates = []
    let _blurredCoverTimeout = null

    let _tapEnabled = true
    let _modulesToLoad = 0
    let _gamesInitialized = 0

    //#region [lifeCycle]
    onMount(() => {

        // Initialize the DOM Observer for interactive elements
        setupDomObserver();

        // Well, if we do some changes on some scripts,
        // arSession is mounted again each time, so we need
        // to reset the props.gamesRunning.
        // This is necessary to be able to iterate when
        // we need to do changes to the UI and not to have reload each time
        if (props.gamesRunning.length > 0) {
            console.warn(
                "WARNING: I'm going to reset props.gamesRunning. If you are doing some changes on the scripts it's normal."
            )
            props.resetGamesRunning
        }

        // Let's start immediately darkening the background...
        // setBlurVisible(true);
        handleBlurredCover({ visible: true })

        // ...and Starting the Reticle, to detect the space around us.
        // We start the Reticle here, and not in the games, because
        // we want the 1st detection to be as quick as possible!
        Reticle.setup(Reticle.MESH_TYPE.RINGS, {
            size: 0.4,
            ringNumber: 4,
            ringThickness: 0.2,
            color: 0xf472b6,
        })

        // When reopening the ARSession it seem to stay "true"...
        // let's force (not clear why I have to do that)
        setInitDetectionCompleted(false)

        // If Debug on desktop we must set the background
        // to black, so to see something...
        const body = document.getElementsByTagName("body")[0]
        if (config.debugOnDesktop) {
            body.style.backgroundColor = "black"

            // Skip init detection
            setInitDetectionCompleted(true)
            console.warn(
                "We are DEBUGGING on desktop and Init detection is skipped!"
            )
        }
        // If not, we must set it to transparent for compatibility on iOS
        else {
            body.style.backgroundColor = "transparent"
        }

        // if we are "user" we must update the views number
        // of this marker (+1)
        if (props.appMode === AppMode.LOAD && !config.debugOnDesktop) {
            firebase.firestore.updateMarkerViews(props.userId, props.marker.id)
        }

        // On TAP on screen
        // event listener
        if (!SceneManager.initialized()) {
            if (!config.debugOnDesktop) {
                console.error("SceneManager is not initialized!")
                alert("SceneManager is not initialized!")
            } else {
                SceneManager.init()
                console.warn(
                    "WARNING: SceneManager is actually NOT initialized, and I have initialized it for you. If you are DEBUGGING on desktop AND you have made some changes it's normal, otherwise it's a problem!"
                )
            }
        } else {
            // On Tap function
            const onTap = () => {
                // Avoid TAP on DOM elements
                if (!_tapEnabled) {
                    _tapEnabled = true
                    return
                }

                // Call onTap function of all the gamesRunning
                props.gamesRunning.forEach((el) => {
                    try {
                        // execute onTap inside a temporary reactive root so
                        // any computations created are attached to a root and can be disposed.
                        const disposer = createRoot(() => {
                            try {
                                el.onTap && el.onTap()
                            } catch (err) {
                                console.error("Error in game onTap:", err)
                            }
                        })
                        // Immediately dispose the temporary root to avoid leaking
                        try {
                            disposer()
                        } catch (e) { }
                    } catch (e) {
                        console.error("Error executing game onTap:", e)
                    }
                })
            }

            SceneManager.controller.addEventListener("select", onTap)

            // Emulate the TAP
            // on desktop
            if (config.debugOnDesktop) {
                document.addEventListener("click", (event) => {
                    const clickedElement = event.target
                    const isNonTappable =
                        clickedElement.matches(
                            "#ar-overlay button, #ar-overlay a, #ar-overlay [data-interactive]"
                        ) ||
                        !!clickedElement.closest(
                            "#ar-overlay button, #ar-overlay a, #ar-overlay [data-interactive]"
                        )
                    _tapEnabled = !isNonTappable
                    onTap()
                })
            }
        }

        // Load games of this marker
        if (props.marker.games.length > 0) {
            loadAllModules()
        } else {
            //TODO - here we must move on...
            // setLoading(() => false);

            // Bypass all the check for initialization
            // and props.runningGames count
            console.log(
                "=== ArSession: no games in this marker, let's set gamesInitialized = true"
            )
            setGamesInitialized(true)
        }
    })


    // createEffect(
    //     on(
    //         () => props.marker.games.length,
    //         (gamesLength) => {
    //             if (gamesLength > 0) {
    //                 loadAllModules();
    //             } else {
    //                 setGamesInitialized(true);
    //             }
    //         }
    //     )
    // )


    onCleanup(() => {
        cleanupDomObserver();
        removeClickableDomElements();
    })

    // createEffect(() => {
    //     if (
    //         gamesInitialized() &&
    //         initDetectionCompleted() &&
    //         localizationState() !== LOCALIZATION_STATE.REQUIRED
    //     ) {
    //         console.log(
    //             "=== ArSession: all requirements to set gamesEnabled = true"
    //         )
    //         setGamesEnabled(true)
    //     }
    // })

    // createEffect(() => {
    //     console.log("ADESSO E' SELEZIONATO IL GAME con ID:", selectedGameId());
    // })

    createEffect(on(selectedGameId, (gameId) => {
        if (gameId) {
            console.log("ADESSO E' SELEZIONATO IL GAME con ID:", gameId);
        }
    }));

    createEffect(() => {
        console.log("*******************************")
        console.log("gamesEnabled:", gamesEnabled())
        console.log("*******************************")
    })


    createEffect(
        on(
            [gamesInitialized, initDetectionCompleted, localizationState],
            ([initialized, detectionCompleted, locState]) => {
                if (
                    initialized &&
                    detectionCompleted &&
                    locState !== LOCALIZATION_STATE.REQUIRED
                ) {
                    console.log(
                        "=== ArSession: all requirements to set gamesEnabled = true"
                    )
                    setGamesEnabled(true);

                    handleBlurredCover({ visible: false, priority: 1 });
                }
            }
        )
    )


    createEffect(on(() => props.gamesRunning, (gamesRunning) => {
        if (gamesRunning.length > 0) {
            console.log(
                "=== ArSession: Games running changed:",
                gamesRunning
            )
            checkAllGamesReady();
        }
    }))


    /** As soon as the Reticle find a surface
     * we want to hide the "InitDetection" component
     * and set prop "enabled={true}" on the games
     */
    createEffect(() => {
        if (props.planeFound) {
            console.log(
                "=== ArSession: plane is found, so we can set initDetectionCompleted = true"
            )
            setInitDetectionCompleted(true);
        }
    })

    /** When init detection is completed
     * we want to hide the blurred cover.
     * If some other script want to show it, instead,
     * the handleBlurredCover system should manage them
     * on the basis of the "priority"
     */
    // createEffect(
    //     on(
    //         () => initDetectionCompleted(),
    //         (isCompleted) => {
    //             if (isCompleted) {
    //                 handleBlurredCover({ visible: false, priority: 1 })
    //             }
    //         }
    //     )
    // )

    /**
     * Load all the games (as bundles) of the marker.
     * In this way we keep the main bundle as small as possible!
     */
    function loadAllModules() {
        for (const el of props.marker.games) {
            if (el.enabled) {
                _modulesToLoad++

                // load dynamically the module
                loadModule(el.id, el.name)
            }
        }
        // setLoading(() => false);
    }

    //#region [handlers]

    /**
     * Go back
     */
    const handleGoBack = () => {
        removeClickableDomElements()
        props.onBack()
    }

    /**
     * Set the reference Matrix4
     * that will be used to set the relative position
     * of the loaded 3D objects
     */
    const handleLocalizationCompleted = (matrix) => {
        setReferenceMatrix(() => matrix)

        // Show all the meshes of all the games
        setGamesVisible(true)

        console.log(
            "=== ArSession: LOCALIZATION COMPLETED! Matrix:",
            referenceMatrix()
        )
        setLocalizationState(() => LOCALIZATION_STATE.COMPLETED)
    }

    /**
     * This function is called each time
     * a new module is mounted,
     * to add it with its functions to gamesRunning of app.jsx
     * (N.B. the gameRunning IS NOT the module that we use here in the return
     * to display the UI of each module!)
     */
    const handleModuleLoaded = (el) => {
        // add to props.gameRunning
        props.addGame(el)
        // update the DOM elements that can be clicked
        updateClickableDomElements()
    }

    /**
     * This function is called each time
     * a new Game is totally initialized
     * (so, everything in the game has been loaded and created)
     * to hide the initializing component message
     */
    const handleGameInitialized = () => {
        _gamesInitialized++
        checkAllGamesReady()
    }

    const checkAllGamesReady = () => {
        console.log("=== ArSession: checkAllGamesReady")
        console.log("======= modules to load:", _modulesToLoad)
        console.log("======= games initialized:", _gamesInitialized)
        console.log("======= games running:", props.gamesRunning.length)

        // When all games have finished to load their assets
        // AND all props.gamesRunning are set
        // (I need to check props.gamesRunning too because if initialization
        // is too quick often the game it's not yet set in props.gamesRunning...!)
        if (
            _gamesInitialized === _modulesToLoad &&
            props.gamesRunning.length === _modulesToLoad
        ) {
            // If just one of the game need localization,
            // we need to show the Localization component
            // as soon as all the games initialized
            for (let i = 0; i < props.gamesRunning.length; i++) {
                const _game = props.gamesRunning[i]

                const gameSpecs = PLUGINS_LIST.find(
                    (g) => g.fileName === _game.name
                )
                if (
                    gameSpecs.localized &&
                    localizationState() !== LOCALIZATION_STATE.COMPLETED
                ) {
                    console.log(
                        "============= ",
                        _game.name,
                        "RICHIEDE DI INIZIARE LA LOCALIZZAZIONE!!"
                    )

                    // Hide all the meshes of all the games
                    setGamesVisible(false)
                    // Show the Localization view
                    setLocalizationState(() => LOCALIZATION_STATE.REQUIRED)
                    break
                }
            }

            console.log("=== ArSession: all games initialized and set!!!")
            setGamesInitialized(true)

            // it should not be necessary here... :/
            updateClickableDomElements()
        }
    }

    //#region [functions]

    /**
     * This function is automatically called when all games are initialized,
     * but, since it's very unpredictable yo know the interactable DOM elements
     * on the page, it should be called also when something on the page change
     */
    let _mutationObserver = null;
    let _updateTimeout = null;
    let _clickableDomElements = []
    function setupDomObserver() {
        if (_mutationObserver) {
            _mutationObserver.disconnect();
        }
        const targetNode = document.getElementById('ar-overlay');
        if (!targetNode) {
            console.error('ar-overlay non trovato, observer non avviato');
            return;
        }
        const callback = (mutationsList) => {
            // Controlla se ci sono cambiamenti ai nodi figli
            const hasChanges = mutationsList.some(m => m.type === 'childList');
            if (hasChanges) {
                clearTimeout(_updateTimeout);
                _updateTimeout = setTimeout(() => {
                    updateClickableDomElements();
                }, 100);
            }
        };
        // Configurazione: osserva aggiunte/rimozioni di nodi in tutto il subtree
        const config = {
            childList: true,  // osserva aggiunte/rimozioni di nodi figli
            subtree: true,    // osserva anche tutti i discendenti
        };
        // Crea e avvia l'observer
        _mutationObserver = new MutationObserver(callback);
        _mutationObserver.observe(targetNode, config);
        console.log('MutationObserver avviato su #ar-overlay');
    }
    function cleanupDomObserver() {
        if (_mutationObserver) {
            _mutationObserver.disconnect();
            _mutationObserver = null;
        }
    }
    function updateClickableDomElements() {
        removeClickableDomElements()
        _clickableDomElements = document.querySelectorAll(
            "#ar-overlay button, #ar-overlay a, #ar-overlay [data-interactive]"
        )
        _clickableDomElements.forEach((element) => {
            // Use passive listeners for touch/pointer to avoid scroll-blocking warnings
            element.addEventListener("pointerdown", disableTap, {
                passive: true,
            })
            element.addEventListener("touchstart", disableTap, {
                passive: true,
            })
        })
        // console.log("clickable DOM elements:", _clickableDomElements)
    }
    function removeClickableDomElements() {
        _clickableDomElements.forEach((element) => {
            // remove with same capture option (passive doesn't affect removal but keep options explicit)
            element.removeEventListener("pointerdown", disableTap, {
                passive: true,
            })
            element.removeEventListener("touchstart", disableTap, {
                passive: true,
            })
        })
    }
    function disableTap(e) {
        _tapEnabled = false
        e.stopPropagation()
    }

    /**
     * Hide (or show) all the objects inside all the games,
     * or inside a specific game
     */
    const setGamesVisible = (value, gameName = null) => {
        props.gamesRunning.forEach((el) => {
            // only one game
            if (gameName) {
                if (el.name === gameName) el.setVisible(value)
            }
            // all games
            else {
                el.setVisible(value)
            }
        })
    }



    const addNewPluginToMarker = async (pluginName) => {
        console.log("ADESSO AGGIUNGO:", pluginName);

        // save new plugin
        const newGameId = await firebase.firestore.addGame(
            props.userId,
            props.marker.id,
            pluginName
        )

        console.log("Creato in Firestore il game con ID:", newGameId);

        // refresh current marker
        // (not sure that is necessary. Ideally we should automatically
        // refresh the modules on props.marker.games changed, but
        // actually does not work as it should)
        props.onNewGameSaved();

        // reset states and load the new module
        setGamesInitialized(false);
        setGamesEnabled(false);
        _modulesToLoad++;
        loadModule(newGameId, pluginName, true);
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
        const raw = await import(`../../plugins/${moduleName}.jsx`)
        const newModule = {
            id: moduleId,
            name: moduleName,
            component: raw.default,
        }
        setModules((prev) => [...prev, newModule])

        // Select the new game created
        if (selectOnEnd) {
            setSelectedGameId(moduleId)
        }
    }

    const handleBlurredCover = (state = {}) => {
        // sistema di gestione di chiamate multiple incoerenti da script diversi...
        const newState = {
            visible: state.visible ?? blurVisible(),
            showHole: state.showHole ?? blurShowHole(),
            priority: state.priority ?? 0,
            timestamp: Date.now(), // For debug/logging
        }
        _blurredCoverStates.push(newState)

        console.log("|||||||||||||||||||||||||| handleBlurredCover:", newState)

        const stack = new Error().stack
        const caller = stack.split("\n")[2]?.trim() // La seconda linea è il chiamante
        console.log("handleBlurredCover chiamata da:", caller)

        if (_blurredCoverTimeout) {
            console.warn("ANOTHER CALL TO handleBlurredCover IN QUEUE!")
            clearTimeout(_blurredCoverTimeout)
        }

        // wait a little to check if some other state
        // is arriving
        _blurredCoverTimeout = setTimeout(() => {
            try {
                if (_blurredCoverStates.length === 0) {
                    console.warn("handleBlurredCover: No states to process")
                    return
                }

                const highestState = _blurredCoverStates.reduce(
                    (max, current) => {
                        return current.priority > max.priority ? current : max
                    }
                )

                // just for debugging
                if (_blurredCoverStates.length > 1) {
                    console.log(
                        ` ***************************** Processed ${_blurredCoverStates.length} blur states, using priority ${highestState.priority}`
                    )
                    console.log(
                        "now setting - visible:",
                        highestState.visible,
                        "showHole:",
                        highestState.showHole
                    )
                    console.log(
                        "********************************************************************"
                    )
                }

                setBlurVisible(highestState.visible)
                setBlurShowHole(highestState.showHole)
            } catch (error) {
                console.error("Error in handleBlurredCover:", error)
            } finally {
                // Reset
                if (!blurVisible() && blurShowHole()) {
                    setTimeout(() => {
                        console.log("RESET")
                        setBlurShowHole(false)
                    }, 1000)
                }

                _blurredCoverStates.length = 0
                _blurredCoverTimeout = null
            }
        }, 200)
    }

    //#region [style]

    const Main = styled("div")`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        padding: 1.5em;
        box-sizing: border-box;
    `

    //#region RENDER

    return (
        <Context.Provider
            value={{
                onLoaded: handleModuleLoaded,
                onInitialized: handleGameInitialized,
                appMode: props.appMode,
                userId: props.userId,
                markerId: props.marker.id,
                handleBlurredCover: (state) => handleBlurredCover(state),
            }}
        >
            <Main id="arSession">
                <BlurredCover
                    visible={blurVisible()}
                    showHole={blurShowHole()}
                    planeFound={props.planeFound}
                />

                {/* HEADER */}
                <Header
                    onClickBack={handleGoBack}>
                    {headerText()}
                </Header>

                {
                    <>
                        {!gamesInitialized() && <Loader text="Inizializzo" />}

                        {/* GAMES */}
                        <For each={modules()}>
                            {(item) => {
                                const Component = item.component
                                return (
                                    <Component
                                        id={item.id}
                                        enabled={gamesEnabled()}
                                        selected={
                                            gamesEnabled() &&
                                            item.id === selectedGameId()
                                        }
                                        referenceMatrix={referenceMatrix()}
                                    />
                                )
                            }}
                        </For>

                        {gamesInitialized() &&

                            (!initDetectionCompleted()
                                ? (<InitialDetection />)
                                :
                                localizationState() ===
                                LOCALIZATION_STATE.REQUIRED && (
                                    <Localization
                                        planeFound={props.planeFound}
                                        setReferenceMatrix={(matrix) =>
                                            handleLocalizationCompleted(matrix)
                                        }
                                    />)
                            )
                        }
                        <UI
                            visible={gamesEnabled()}
                            marker={props.marker}
                            addNewPluginToMarker={(pluginName) => addNewPluginToMarker(pluginName)}
                            selectedGameId={selectedGameId()}
                            setSelectedGameId={(id) =>
                                setSelectedGameId(id)
                            }
                            setHeaderText={(text) => setHeaderText(text)}
                        />
                    </>
                }
            </Main>
        </Context.Provider>
    )
}
