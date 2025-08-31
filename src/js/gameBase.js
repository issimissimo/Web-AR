import { onMount, createSignal, useContext, createEffect } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { PLUGINS_LIST } from '@plugins/pluginsIndex';
import { AppMode } from '@/main';
import { Context } from '@views/ar-overlay/arSession';
import SceneManager from '@js/sceneManager';
import modelLoader from '@tools/three/modelLoader';
import { getObjOffsetMatrix, getGlobalMatrixFromOffsetMatrix } from '@tools/three/maths';



// ===== HOOK BASE =====
export function useGame(gameName, gameId, config = {}) {

    const firebase = useFirebase();
    const context = useContext(Context);
    const gameDetails = PLUGINS_LIST.find(g => g.fileName === gameName);
    const gameAssets = [];
    const [initialized, setInitialized] = createSignal(false);
    const [gameData, setGameData] = createSignal(null);
    const loader = new modelLoader();


    onMount(() => {
        context.onLoaded(game);
    });

    createEffect(() => {
        if (initialized()) {
            context.onInitialized();
        }
    })

    const localizationCompleted = () => {
        return context.localizationCompleted();
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



    // Define base functions
    const _onTapBase = () => {
        console.log(`${gameName} onTapBase`);
    };
    const _renderLoopBase = () => {
        console.log(`${gameName} renderLoopBase`);
    };


    // Define overridable / super functions
    const onTap = config.onTap || _onTapBase;
    const renderLoop = config.renderLoop || _renderLoopBase;

    // This
    const game = {
        name: gameName,
        id: gameId,
        appMode: context.appMode,
        initialized,
        setInitialized,
        localizationCompleted,
        blurBackground: context.blurBackground,
        referenceMatrix: context.referenceMatrix,
        getObjOffsetMatrix,
        getGlobalMatrixFromOffsetMatrix,
        onTap,
        super: { onTap: _onTapBase },
        renderLoop,
        loadGameData,
        addToScene,
        removePreviousFromScene,
        removeAllFromScene,
        setVisible,
        gameDetails,
        gameData,
        setGameData,
        loader
    }

    return {
        game
    };
}