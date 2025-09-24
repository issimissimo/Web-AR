import { onMount, createSignal, useContext, createEffect, onCleanup } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { PLUGINS_LIST } from '@plugins/pluginsIndex';
import { AppMode } from '@/main';
import { Context } from '@views/ar-overlay/arSession';
import SceneManager from '@js/sceneManager';
import { getObjOffsetMatrix, getGlobalMatrixFromOffsetMatrix } from '@tools/three/maths';
import { LoadAudio } from '@tools/three/audioTools';
import { render } from 'solid-js/web';


// ===== HOOK BASE =====
export function useGame(gameName, gameId, config = {}) {

    const firebase = useFirebase();
    const context = useContext(Context);
    const gameDetails = PLUGINS_LIST.find(g => g.fileName === gameName);
    let gameAssets = [];
    const [gameData, setGameData] = createSignal(null);
    const [mountEl, setMountEl] = createSignal(null);
    let _disposer = null;
    let _initialized = false;
    let _hasMountedView = false;

    // const loader = new GlbLoader();
    let audioTap;
    let audioUndo;

    onMount(async () => {
        audioTap = await new LoadAudio('sounds/tap.ogg', SceneManager.listener);
        audioUndo = await new LoadAudio('sounds/undo.ogg', SceneManager.listener);
        context.onLoaded(game);

        // Wait for the #plugins-ui container to exist. The container may be
        // created dynamically by other Solid components, so querying it
        // immediately can return null. Use a MutationObserver with a
        // short timeout fallback and store the element in a signal so the
        // Portal can be rendered reactively below.
        const waitFor = () => new Promise((resolve) => {
            const el = document.getElementById('plugins-ui');
            if (el) return resolve(el);
            const obs = new MutationObserver(() => {
                const f = document.getElementById('plugins-ui');
                if (f) { obs.disconnect(); resolve(f); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        });

        const el = await waitFor();
        if (el) {
            setMountEl(el);
        }
    });




    const setInitialized = () => {
        if (!_initialized) {
            _initialized = true;
            console.log(`<<<<<< ${gameName} è inizializzato`)
            context.onInitialized();
        }
    }

    // Allow plugins to register a render function which will be mounted
    // automatically into the shared mount element when it becomes available.
    const mountView = (viewFn) => {
        if (_hasMountedView) return; // only mount once per game instance
        _hasMountedView = true;

        createEffect(() => {
            const el = mountEl();
            if (!el || _disposer) return;
            try {
                _disposer = render(viewFn, el);
                console.log(`${gameName}: mounted view into`, el);
            } catch (err) {
                console.error(`${gameName}: error mounting view`, err);
            }
        });

        onCleanup(() => {
            if (_disposer) {
                try { _disposer(); } catch (e) { }
                _disposer = null;
                console.log(`${gameName}: disposed mounted view`);
            }
        });
    }


    // Load game data from Realtime Database
    const loadGameData = async () => {
        try {
            const path = `${context.userId}/markers/${context.markerId}/games/${gameId}`;
            const data = await firebase.realtimeDb.loadData(path);
            setGameData(data);
        } catch (error) {
            console.error("Errore nel caricamento JSON:", error);
        }
    }


    const saveGameData = async () => {
        try {
            const path = `${context.userId}/markers/${context.markerId}/games/${gameId}`;
            await firebase.realtimeDb.saveData(path, gameData());
            console.log('Salvati dati in RealtimeDB con ID:', gameId)

        } catch (error) {
            console.log("Errore nel salvataggio JSON:", error);
        }

    }



    const addToScene = (asset) => {

        // add new property
        const customProps = {
            hidden: !asset.visible
        }
        asset.customProps = customProps;
        gameAssets.push(asset);
        SceneManager.scene.add(asset);
    }

    const removePreviousFromScene = () => {
        const assetToRemove = gameAssets.pop();
        SceneManager.scene.remove(assetToRemove);
    }

    const removeAllFromScene = () => {
        gameAssets.forEach(el => {
            SceneManager.scene.remove(el);
        })
        gameAssets = [];
    }

    const setVisible = (value) => {
        gameAssets.forEach(asset => {
            if (asset.isMesh && !asset.customProps.hidden) asset.visible = value;
        });
    }

    const setVisibleByName = (assetName, value) => {
        gameAssets.forEach(asset => {
            if (asset.name === assetName && !asset.customProps.hidden) {
                asset.visible = value;
                console.log(asset)
            }
        });
    }



    // Define base functions
    const _onTapBase = () => {
        audioTap.play();
    };

    const _renderLoopBase = () => {
        console.log(`${gameName} renderLoopBase`);
    };

    const _closeBase = () => {
        console.log(`${gameName} closeBase`);
    }

    const onUndo = () => {
        audioUndo.play();
    }


    // Define overridable / super functions
    const onTap = config.onTap || _onTapBase;
    const renderLoop = config.renderLoop || _renderLoopBase;
    const close = config.close || _closeBase;


    // This
    const game = {
        name: gameName,
        id: gameId,
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
        forceUpdateDomElements: context.forceUpdateDomElements,
        loadGameData,
        saveGameData,
        addToScene,
        removePreviousFromScene,
        removeAllFromScene,
        setVisible,
        setVisibleByName,
        gameDetails,
        gameData,
        setGameData,
        mountEl
        ,
        mountView
    }


    return {
        game
    };
}