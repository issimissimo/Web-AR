import {
    onMount,
    createSignal,
    useContext,
    createEffect,
    onCleanup,
} from "solid-js"
import { useFirebase } from "@hooks/useFirebase"
import { PLUGINS_LIST } from "@plugins/pluginsIndex"
import { AppMode } from "@/app"
import { Context } from "@views/ar-overlay/arSession"
import SceneManager from "@js/sceneManager"
import {
    getObjOffsetMatrix,
    getGlobalMatrixFromOffsetMatrix,
} from "@tools/three/maths"
import { LoadAudio } from "@tools/three/audioTools"
import { render } from "solid-js/web"

// ===== HOOK BASE =====
export function useGame(gameName, gameId, config = {}) {
    const firebase = useFirebase()
    const context = useContext(Context)
    const gameDetails = PLUGINS_LIST.find((g) => g.fileName === gameName)
    let gameAssets = []
    const [gameData, setGameData] = createSignal(null)
    const [mountEl, setMountEl] = createSignal(null)
    const realtimeDbPath = `${context.userId}/markers/${context.markerId}/games/${gameId}`

    let _disposer = null
    let _initialized = false
    let _hasMountedView = false

    let sounds = {
        tap: null,
        undo: null,
        click: null
    }

    // let audioTap
    // let audioUndo

    onMount(async () => {
        sounds.tap = await new LoadAudio("sounds/tap.mp3", SceneManager.listener)
        sounds.undo = await new LoadAudio("sounds/undo.mp3", SceneManager.listener)
        sounds.click = await new LoadAudio("sounds/smallClick.mp3", SceneManager.listener)
        context.onLoaded(game)

        // Wait for the #plugins-ui container to exist. The container may be
        // created dynamically by other Solid components, so querying it
        // immediately can return null. Use a MutationObserver with a
        // short timeout fallback and store the element in a signal so the
        // Portal can be rendered reactively below.
        const waitFor = () =>
            new Promise((resolve) => {
                const el = document.getElementById("plugins-ui")
                if (el) return resolve(el)
                const obs = new MutationObserver(() => {
                    const f = document.getElementById("plugins-ui")
                    if (f) {
                        obs.disconnect()
                        resolve(f)
                    }
                })
                obs.observe(document.body, { childList: true, subtree: true })
            })

        const el = await waitFor()
        if (el) {
            setMountEl(el)
        }
    })

    const setInitialized = () => {
        if (!_initialized) {
            _initialized = true
            console.log(`<<<<<< ${gameName} è inizializzato`)
            context.onInitialized()
        }
    }

    // Allow plugins to register a render function which will be mounted
    // automatically into the shared mount element when it becomes available.
    const mountView = (viewFn) => {
        if (_hasMountedView) return // only mount once per game instance
        _hasMountedView = true

        createEffect(() => {
            const el = mountEl()
            if (!el || _disposer) return
            try {
                _disposer = render(viewFn, el)
            } catch (err) {
                console.error(`${gameName}: error mounting view`, err)
            }
        })

        onCleanup(() => {
            if (_disposer) {
                try {
                    _disposer()
                } catch (e) { }
                _disposer = null
            }
        })
    }

    // Load game data from Realtime Database
    const loadGameData = async () => {
        try {
            const data = await firebase.realtimeDb.loadData(realtimeDbPath)
            setGameData(data)
        } catch (error) {
            console.error("Errore nel caricamento JSON:", error)
        }
    }

    const saveGameData = async () => {
        try {
            await firebase.realtimeDb.saveData(realtimeDbPath, gameData())
            console.log("Salvati dati in RealtimeDB con ID:", gameId)
        } catch (error) {
            console.log("Errore nel salvataggio JSON:", error)
        }
    }

    const addToScene = (asset) => {
        // add new property
        const customProps = {
            hidden: !asset.visible,
        }
        asset.customProps = customProps
        gameAssets.push(asset)
        SceneManager.scene.add(asset)
    }

    const removePreviousFromScene = () => {
        const assetToRemove = gameAssets.pop();
        console.log("adesso rimuovo dalla scena:", assetToRemove)
        SceneManager.scene.remove(assetToRemove)
    }

    const removeAllFromScene = () => {
        gameAssets.forEach((el) => {
            SceneManager.scene.remove(el)
        })
        gameAssets = []
    }

    const setVisible = (value) => {
        gameAssets.forEach((asset) => {
            if (asset.isMesh && !asset.customProps.hidden) asset.visible = value
        })
    }

    const setAssetVisibleByName = (assetName, value) => {
        gameAssets.forEach((asset) => {
            if (asset.name === assetName && !asset.customProps.hidden) {
                asset.visible = value
                console.log(asset)
            }
        })
    }

    // Define base functions
    const _onTapBase = () => {
        sounds.tap.play()
    }

    const _renderLoopBase = () => {
        console.log(`${gameName} renderLoopBase`)
    }

    const _closeBase = () => {
        console.log(`${gameName} closeBase`)
    }

    const onUndo = () => {
        sounds.undo.play()
    }

    const onClick = () => {
        sounds.click.play()
    }

    // Define overridable / super functions
    const onTap = config.onTap || _onTapBase
    const renderLoop = config.renderLoop || _renderLoopBase
    const close = config.close || _closeBase

    // This
    const game = {
        name: gameName,
        id: gameId,
        userId: context.userId,
        APP_MODE: AppMode,
        appMode: context.appMode,
        setInitialized,
        handleBlurredCover: context.handleBlurredCover,
        getObjOffsetMatrix,
        getGlobalMatrixFromOffsetMatrix,
        onTap,
        super: { onTap: _onTapBase },
        renderLoop,
        close,
        onUndo,
        loadGameData,
        saveGameData,
        addToScene,
        removePreviousFromScene,
        removeAllFromScene,
        setVisible,
        setAssetVisibleByName: setAssetVisibleByName,
        gameDetails,
        gameData,
        setGameData,
        mountEl,
        mountView,
        realtimeDbPath
    }

    return {
        game,
    }
}
