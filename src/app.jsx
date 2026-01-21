import { createEffect, createSignal, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { useFirebase } from "@hooks/useFirebase"
import { config } from "@js/config"

import { Container } from "@components/smallElements"

// Views
import UserProfile from "@views/app/UserProfile"
import Register from "@views/app/register"
import Login from "@views/app/login"
import MarkerList from "@views/app/markerList"
import EditMarker from "@views/app/editMarker"
import Anonymous from "@views/app/anonymous"
import ARUnsupported from "@views/app/ARunsupported"
import Offline from "@/views/app/Offline"
import ArSession from "@views/ar-overlay/arSession"

// XR
import SceneManager from "@js/sceneManager"
import Reticle from "@js/reticle"

// Monitor
import FPSMonitor from "@tools/three/FPSMonitor"
import MemoryMonitor from "@tools/three/MemoryMonitor"

// Check Internet
import { checkInternetConnection } from "@/tools/internetCheck"

// ===== EXTRA =====
import Toast from "@components/Toast"

/*
 * This function is called by the "Enter AR" button
 * only when we have debugOnDesktop=true in the configuration file
 * - public/config.json -
 */
let globalGoToArSession
export const TestGameOnDesktopFallback = () => {
    console.warn(
        "We are DEBUGGING on desktop and AR session is NOT initialized! Just use for debug on desktop purpose! Please check 'appConfig.json' file in PUBLIC folder to modify the settings!",
    )
    globalGoToArSession()
}

export const AppMode = {
    SAVE: "save",
    LOAD: "load",
}

const VIEWS = {
    USER_PROFILE: "userProfile",
    REGISTER: "register",
    LOGIN: "login",
    MARKER_LIST: "markerList",
    EDIT_MARKER: "editMarker",
    ANONYMOUS: "anonymous",
    AR_SESSION: "arSession",
    AR_NOT_SUPPORTED: "arNotSupported",
    OFFLINE: "offLine",
}

export default function App() {
    //#region [constants]
    const firebase = useFirebase()
    const [currentAppMode, setCurrentAppMode] = createSignal(null)
    const [currentView, setCurrentView] = createSignal(null)
    const [previousView, setPreviousView] = createSignal(null)
    const [loading, setLoading] = createSignal(true)
    const [userId, setUserId] = createSignal(null)
    const [currentMarker, setCurrentMarker] = createSignal(null)
    const [planeFound, setPlaneFound] = createSignal(false)
    const [gamesRunning, setGamesRunning] = createSignal([])
    let fpsMonitor
    let memoryMonitor
    let arSessionRef
    let toastRef

    //#region [lifeCycle]
    onMount(async () => {
        // Check if you have Internet
        const isOnline = await checkInternetConnection()
        if (!isOnline) {
            console.error("NON SEI ONLINE!!!")
            goToOffline()
            return
        }

        // Disable log
        if (config.production) {
            console.log = function () {}
        }

        // set body color
        setBodyColor()

        // We need to copy the function outside
        // so to be able to use it for debug on desktop purpose
        globalGoToArSession = goToArSession

        // Auth
        if ("xr" in navigator) {
            navigator.xr
                .isSessionSupported("immersive-ar")
                .then((supported) => {
                    if (!supported && !config.debugOnDesktop) {
                        goToArNotSupported()
                    } else {
                        // Search for URL query string
                        const urlParams = new URLSearchParams(
                            window.location.search,
                        )
                        const hasQueryParams =
                            urlParams.has("userId") && urlParams.has("markerId")

                        // Access as anonymous
                        if (hasQueryParams || config.debugLoadMode) {
                            setCurrentAppMode(() => AppMode.LOAD)
                            accessAnonymous(urlParams)
                        } else {
                            // Login or register
                            setCurrentAppMode(() => AppMode.SAVE)
                            if (!firebase.auth.authLoading()) {
                                checkAuthStatus()
                            } else {
                                const timer = setInterval(() => {
                                    if (!firebase.auth.authLoading()) {
                                        clearInterval(timer)
                                        checkAuthStatus()
                                    }
                                }, 100)
                            }
                        }
                    }
                })
        } else {
            goToArNotSupported()
        }
    })

    createEffect(() => {
        // Hide the preloader
        if (!loading()) {
            window.Loader.hide()
        }
    })

    //#region [functions]
    /**
     * Anonymous access
     */
    const accessAnonymous = async (params) => {
        if (!firebase.auth.user()) {
            await firebase.auth.loginAnonymous()
        }

        setUserId(() =>
            config.debugLoadMode ? config.debugUserId : params.get("userId"),
        )
        const markerId = config.debugLoadMode
            ? config.debugMarkerId
            : params.get("markerId")
        const data = await firebase.firestore.fetchMarker(userId(), markerId)
        if (data) {
            setupMarker({ id: markerId, data: data }, () => goToAnonymous())
        } else {
            setLoading(false)
            goToAnonymous()
        }
    }

    /**
     * Check auth status
     */
    const checkAuthStatus = async () => {
        if (firebase.auth.user()) {
            if (firebase.auth.user().isAnonymous) {
                console.log(
                    "You previously logged as anonymous, so you need to login again",
                )
                goToLogin()
            } else {
                if (config.production) {
                    // update last user login timestamp
                    const userId = firebase.auth.user().uid
                    await firebase.auth.updateLoginTimestamp(userId)
                }
                goToMarkerList()
            }
        } else {
            goToLogin()
        }
    }

    /**
     * Add a new marker to the App
     * and set it as currentMarker
     */
    const setupMarker = async (marker = null, callback = null) => {
        // If no Games are provided, load the all the Games
        // from firestore for this marker
        if (marker.id && !marker.data.games) {
            console.log(
                "no marker.data.games provided, now loading them from firestore!",
            )
            marker.data.games = await firebase.firestore.fetchGames(
                userId(),
                marker.id,
            )
        }

        // reorder games by timestamp
        // (last at the end)
        let sortedGames
        if (marker?.data?.games) {
            console.log("riordino....")
            sortedGames = marker.data.games.sort((a, b) => {
                // Controllo rapido dell'esistenza di created.seconds
                const aSeconds = a?.created?.seconds
                const bSeconds = b?.created?.seconds

                // Se uno dei due non ha il timestamp valido
                if (
                    typeof aSeconds !== "number" ||
                    typeof bSeconds !== "number"
                ) {
                    // Gli elementi senza timestamp vanno alla fine
                    if (
                        typeof aSeconds !== "number" &&
                        typeof bSeconds === "number"
                    )
                        return 1
                    if (
                        typeof aSeconds === "number" &&
                        typeof bSeconds !== "number"
                    )
                        return -1
                    return 0
                }
                return aSeconds - bSeconds
            })
            marker.data.games = sortedGames
        }

        const newMarker = {
            id: marker.id ?? null,
            created: marker?.data?.created ?? null,
            name: marker?.data?.name ?? null,
            coverTitle: marker?.data?.coverTitle ?? null,
            cover: marker?.data?.cover ?? null,
            views: marker?.data?.views ?? null,
            like: marker?.data?.like ?? null,
            games: marker?.data?.games ?? null,
        }

        setCurrentMarker(() => newMarker)
        console.log("current marker:", currentMarker())

        if (loading()) setLoading(false)

        callback?.()
    }

    /**
     * Toggle background visibility
     */
    const setBackgroundVisible = (value) => {
        document.getElementById("backgroundContainer").style.display = value
            ? "flex"
            : "none"
    }

    const setBodyColor = () => {
        const body = document.getElementsByTagName("body")[0]
        const bgColor =
            getComputedStyle(body).getPropertyValue("--color-background")
        body.style.backgroundColor = bgColor
    }

    /**
     * Navigation
     */
    const goToUserProfile = () => {
        setPreviousView(() => currentView())
        setCurrentView(VIEWS.USER_PROFILE)
    }
    const goToRegister = () => setCurrentView(VIEWS.REGISTER)
    const goToLogin = () => {
        setLoading(false)
        setCurrentView(VIEWS.LOGIN)
    }
    const goToMarkerList = () => {
        setLoading(false)
        setUserId(() => firebase.auth.user().uid)
        setCurrentView(VIEWS.MARKER_LIST)
    }
    const goToEditMarker = () => setCurrentView(VIEWS.EDIT_MARKER)
    const goToAnonymous = () => setCurrentView(VIEWS.ANONYMOUS)
    const goToArSession = () => {
        setBackgroundVisible(false)
        setCurrentView(VIEWS.AR_SESSION)
    }
    const goToArNotSupported = () => {
        setLoading(false)
        setCurrentView(VIEWS.AR_NOT_SUPPORTED)
    }
    const goToOffline = () => {
        setLoading(false)
        setCurrentView(VIEWS.OFFLINE)
    }
    const goToPreviousView = () => setCurrentView(previousView())

    /**
     * Handles the rendering loop for the AR scene.
     * If an XR frame is available, updates the Reticle based on the current frame and surface type.
     * Always updates the SceneManager for each animation frame.
     *
     * N.B: We NEED to put the render function in the SAME module
     * in which we initialize the scene (unfortunately)!
     */
    function render(timestamp, frame) {
        if (SceneManager.initialized()) {
            // Update Reticle
            if (frame && Reticle.initialized()) {
                Reticle.update(frame, (surfType) => {})
                if (Reticle.enabled()) {
                    // console.log("Reticle.isHitting():", Reticle.isHitting())
                    setPlaneFound(Reticle.isHitting())
                }
            }

            if (frame) {
                const referenceSpace = SceneManager.renderer.xr.getReferenceSpace()
                const pose = frame.getViewerPose(referenceSpace)
                if (pose) {
                    console.log("---> POSE <--- :", pose)
                } else {
                    console.log("Tracking perso. Inquadra l'ambiente.")
                }
            }

            // update Monitors
            if (fpsMonitor) fpsMonitor.update()
            if (memoryMonitor) memoryMonitor.update(performance.now())

            // render the loop of the running Games
            gamesRunning().forEach((el) => el.renderLoop())

            // Update Scene
            SceneManager.update()
        }
    }

    //#region [handlers]

    /**
     * Show the toast message
     */
    const handleShowToast = (message, options = {}) => {
        toastRef.show(message, options)
    }

    /**
     * Initialize Three Scene, with AR Button
     * and go to ARSession
     */
    const handleInitScene = () => {
        if (SceneManager.initialized()) return
        SceneManager.init()
        SceneManager.renderer.setAnimationLoop(render)
        SceneManager.renderer.xr.addEventListener("sessionstart", () => {
            goToArSession()
        })
        // Initialize FPS Monitor
        fpsMonitor = new FPSMonitor(config.minimumFPS, 60) // soglia 15fps, campiona 60 frame
        fpsMonitor.on("lowfps", (e) => {
            console.warn(`FPS bassi: ${e.detail.fps.toFixed(2)}`)
            handleShowToast("Il tuo dispositivo ha basse prestazioni", {
                duration: 10000,
            })
            if (arSessionRef) arSessionRef.onLowFps()
        })
        fpsMonitor.on("normalfps", (e) => {
            console.log(`FPS ok: ${e.detail.fps.toFixed(2)}`)
            if (arSessionRef) arSessionRef.onNormalFps()
        })
        // Initialize Memory Monitor
        memoryMonitor = new MemoryMonitor(90, 2000) // 90% soglia, check ogni 2 secondi
        memoryMonitor.on("highmemory", (e) => {
            console.warn(`Memoria al ${e.detail.usagePercent}%!`)
            handleShowToast("Il tuo dispositivo sta esaurendo la memoria", {
                duration: 10000,
            })
            if (arSessionRef) arSessionRef.onHighMemory()
        })
    }

    /**
     * Destroy scene
     * (mainly used by EditMarker)
     */
    const handleDestroyScene = () => {
        SceneManager.destroy()
    }

    /**
     * Clear all and
     * go back to 1st screen
     */
    const handleReset = () => {
        // handle the closing of the running Games
        gamesRunning().forEach((el) => el.close())

        if (Reticle.initialized()) Reticle.destroy()
        SceneManager.destroy()
        fpsMonitor = null
        memoryMonitor = null

        if (currentAppMode() === AppMode.SAVE) {
            goToMarkerList()
            setupMarker({ id: null, data: null })
        } else if (currentAppMode() === AppMode.LOAD) {
            goToAnonymous()
        }

        setGamesRunning(() => [])
        setBackgroundVisible(true)
        setPlaneFound(false)
        setBodyColor()
    }

    //#region [return]
    const renderView = () => {
        switch (currentView()) {
            case VIEWS.USER_PROFILE:
                return (
                    <UserProfile
                        user={firebase.auth.user()}
                        onBack={goToPreviousView}
                        onLogout={goToLogin}
                    />
                )

            case VIEWS.REGISTER:
                return (
                    <Register
                        onSuccess={goToMarkerList}
                        onGoToLogin={goToLogin}
                    />
                )

            case VIEWS.LOGIN:
                return (
                    <Login
                        onSuccess={goToMarkerList}
                        onGoToRegister={goToRegister}
                    />
                )

            case VIEWS.MARKER_LIST:
                return (
                    <MarkerList
                        setLoading={(value) => setLoading(() => value)}
                        onCreateNewMarker={() => {
                            setupMarker({ id: null, data: null })
                            goToEditMarker()
                        }}
                        onMarkerClicked={(marker) => {
                            const markerData = {
                                name: marker.name,
                                coverTitle: marker.coverTitle,
                                created: marker.created,
                                like: marker.like,
                                views: marker.views,
                            }
                            setupMarker(
                                { id: marker.id, data: markerData },
                                () => goToEditMarker(),
                            )
                        }}
                        goToUserProfile={goToUserProfile()}
                    />
                )

            case VIEWS.EDIT_MARKER:
                return (
                    <EditMarker
                        userId={userId()}
                        marker={currentMarker()}
                        onNewMarkerCreated={(id, name) => {
                            const markerData = { name: name }
                            setupMarker({ id: id, data: markerData })
                        }}
                        onMarkerUpdated={(name, games) => {
                            const markerData = { name: name, games: games }
                            setupMarker({
                                id: currentMarker().id,
                                data: markerData,
                            })
                        }}
                        initScene={handleInitScene}
                        destroyScene={handleDestroyScene}
                        onBack={handleReset}
                        goToUserProfile={goToUserProfile()}
                    />
                )

            case VIEWS.ANONYMOUS:
                return (
                    <Anonymous
                        userId={userId()}
                        marker={currentMarker()}
                        markerId={currentMarker().id}
                        loading={loading()}
                        initScene={handleInitScene}
                    />
                )

            case VIEWS.AR_SESSION:
                return (
                    <Portal mount={document.getElementById("ar-overlay")}>
                        {/* We MUST KEEP the toast here because on iOS will be just leaved ar-overlay*/}
                        <Toast ref={toastRef} />
                        <ArSession
                            ref={arSessionRef}
                            appMode={currentAppMode()}
                            userId={userId()}
                            marker={currentMarker()}
                            onBack={handleReset}
                            planeFound={planeFound()}
                            gamesRunning={gamesRunning()}
                            resetGamesRunning={setGamesRunning(() => [])}
                            addGame={(el) =>
                                setGamesRunning((prev) => [...prev, el])
                            }
                            onNewGameSaved={() => {
                                const markerData = {
                                    name: currentMarker().name,
                                }
                                setupMarker({
                                    id: currentMarker().id,
                                    data: markerData,
                                })
                            }}
                        />
                    </Portal>
                )

            case VIEWS.AR_NOT_SUPPORTED:
                return <ARUnsupported />

            case VIEWS.OFFLINE:
                return <Offline />

            default:
                return <div />
        }
    }

    return (
        <Container>
            <Show when={currentView() !== VIEWS.AR_SESSION}>
                <Toast ref={toastRef} />
            </Show>
            {renderView()}
        </Container>
    )
}
