import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { render } from 'solid-js/web';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { Vector3 } from 'three';
import Reticle from '@js/reticle';
import Toolbar from '@views/ar-overlay/Toolbar';
import { config } from '@js/config';
import * as THREE from "three";
// import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
// import { render } from 'solid-js/web';
// import { useGame } from '@js/gameBase';
// import { styled } from 'solid-styled-components';
// import Reticle from '@js/reticle';
// import Toolbar from '@views/ar-overlay/Toolbar';
// import * as THREE from 'three';
import HorizontalSlider from '@views/ar-overlay/HorizontalSlider';
import Button from '@components/Button';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const defaultGameData = [];

export default function pointLights(props) {
    const { game } = useGame('pointLights', props.id, {
        onTap: () => {
            if (props.enabled && !currentLight()) {
                if (game.appMode === 'save') {
                    game.super.onTap();
                    spawnLightOnTap();
                }
            }
        },
        renderLoop: () => {}
    });

    const [currentLight, setCurrentLight] = createSignal(null);
    const [intensity, setIntensity] = createSignal(5);
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);
    const [mountEl, setMountEl] = createSignal(null);
    let _disposer = null;

    const hasUnsavedChanges = createMemo(() => JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData()));

    onMount(async () => {
        await game.loadGameData();
        if (!game.gameData()) game.setGameData(defaultGameData);
        setLastSavedGameData([...game.gameData()]);
        game.setInitialized();

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
        if (el) setMountEl(el);
    });

    createEffect(() => {
        const el = mountEl();
        if (!el) return;
        if (_disposer) return;

        _disposer = render(() => (
            <div id="pointlights-root">
                <div id="pointlights-portal-static" style={{ padding: '2px', border: '1px solid #0f0' }}>POINTLIGHTS PORTAL STATIC</div>
                <button onClick={() => spawnLightOnTap()}>SPAWN!</button>

                {currentLight() && (
                    <>
                        <HorizontalSlider value={intensity} setValue={setIntensity} />
                        <Button onClick={storeLightInData} icon={faCheck} small={true}>Fatto!</Button>
                    </>
                )}

                <Toolbar
                    buttons={["undo", "save"]}
                    onUndo={handleUndo}
                    onSave={handleSave}
                    saveActive={hasUnsavedChanges() && !currentLight()}
                />
            </div>
        ), el);

        return () => {
            if (_disposer) {
                try { _disposer(); } catch (e) { }
                _disposer = null;
            }
        };
    });

    createEffect(() => {
        if (currentLight()) currentLight().intensity = intensity() / 2;
    });

    const handleUndo = () => {
        game.onUndo();
        game.removePreviousFromScene();
        game.removePreviousFromScene();
        game.setGameData(game.gameData().slice(0, -1));
    };

    const handleSave = async () => {
        await game.saveGameData();
        setLastSavedGameData([...game.gameData()]);
    };

    function spawnLightOnTap() {
        const _light = createLight(Reticle.getHitMatrix(), 0xffffff, intensity());
        setCurrentLight(_light);
    }

    function storeLightInData() {
        const diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, currentLight());
        const newData = { intensity: currentLight().intensity, diffMatrix };
        game.setGameData((prev) => [...prev, newData]);
        setCurrentLight(null);
    }

    function loadAllLights() {
        game.gameData().forEach((el) => {
            const diffMatrix = new THREE.Matrix4();
            diffMatrix.fromArray(el.diffMatrix.elements);
            const globalMatrix = game.getGlobalMatrixFromOffsetMatrix(props.referenceMatrix, diffMatrix);
            createLight(globalMatrix, el.color, el.intensity);
        });
        game.setVisibleByName('helper', props.selected);
    }

    function createLight(matrix, colorVal, intensityVal) {
        const newLight = new THREE.PointLight(colorVal, intensityVal);
        newLight.matrixAutoUpdate = false;
        newLight.matrix.copy(matrix);
        newLight.intensity = intensityVal;
        newLight.name = 'pointLight';
        game.addToScene(newLight);

        const helper = new THREE.PointLightHelper(newLight, 0.1, 0xf2e600);
        helper.name = 'helper';
        game.addToScene(helper);
        return newLight;
    }

    const Container = styled('div')`
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2em;
    `;

    return null;
}