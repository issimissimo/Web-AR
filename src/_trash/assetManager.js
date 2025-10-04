import * as THREE from "three";
import { Matrix4 } from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Asset } from './asset.js';
import { getOffsetMatrix, getGlobalMatrixFromOffsetMatrix } from "../tools/three/maths.js";


let _scene = null;
const _assets = new Map();
const _loader = new GLTFLoader();
let _referenceMatrix = new THREE.Matrix4();
let _initialized = false;



const AssetManager = {
    init(scene, referenceMatrix) {
        if (!_initialized) {
            _scene = scene;
            _referenceMatrix.copy(referenceMatrix);
            _initialized = true;
        }
    },


    addAsset(type, glbFileName, options = {}) {
        const asset = new Asset(type, glbFileName, options);
        _assets.set(asset.id, asset);
        return asset;
    },


    // removeAsset(id) {
    //     const asset = _assets.get(id);
    //     if (asset && asset.mesh && asset.mesh.parent) {
    //         asset.mesh.parent.remove(asset.mesh);
    //     }
    //     _assets.delete(id);
    // },

    removeAsset(id) {
        const asset = _assets.get(id);
        if (asset) {
            // Rimuovi dalla scena Three.js se caricato
            if (asset.mesh) {
                if (_scene) {
                    _scene.remove(asset.mesh);
                } else if (asset.mesh.parent) {
                    asset.mesh.parent.remove(asset.mesh);
                }

                // Cleanup delle risorse
                asset.mesh.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }

            // Rimuovi dalla collezione
            _assets.delete(id);
            return true;
        }
        return false;
    },


    // Carica il modello GLB per un asset
    async loadAsset(assetId) {
        const asset = _assets.get(assetId);
        if (!asset || asset.isLoaded) return asset;

        try {
            const gltf = await new Promise((resolve, reject) => {
                _loader.load(
                    `models/${asset.glbFileName}`,
                    resolve,
                    undefined,
                    reject
                );
            });

            asset.mesh = gltf.scene;
            asset.mesh.userData.assetId = asset.id;
            asset.mesh.matrixAutoUpdate = false;
            asset.applyMatrixToMesh();
            asset.mesh.visible = true;
            asset.isLoaded = true;

            _scene.add(asset.mesh);
            return asset;

        } catch (error) {
            console.error(`Errore nel caricamento di ${asset.glbFileName}:`, error);
            throw error;
        }
    },


    async loadAllAssets() {
        const promises = Array.from(_assets.keys()).map(id =>
            this.loadAsset(id, _scene)
        );
        return Promise.all(promises);
    },


    // Serializza tutti gli asset per il database
    exportToJSON() {
        const assetsArray = Array.from(_assets.values()).map(asset =>
            asset.toJSON(_referenceMatrix));
        return {
            assets: assetsArray,
            version: "1.0",
            timestamp: new Date().toISOString()
        };
    },


    importFromJSON(data) {
        _assets.clear();

        if (data.assets) {
            data.assets.forEach(assetData => {
                const asset = Asset.fromJSON(assetData, _referenceMatrix);
                _assets.set(asset.id, asset);
            });
        }

        return _assets.size;
    },


    // Ottiene asset per tipo
    getAssetsByType(type) {
        return Array.from(_assets.values()).filter(asset => asset.type === type);
    },

    // Trova asset per ID
    getAsset(id) {
        return _assets.get(id);
    },

    // Lista tutti gli asset
    getAllAssets() {
        return Array.from(_assets.values());
    },

    // More for debugging
    changeReferenceMatrix(newReferenceMatrix) {
        _referenceMatrix.copy(newReferenceMatrix);
    },

    // Aggiorna tutti gli asset caricati con una nuova reference matrix
    updateReferenceMatrix(newReferenceMatrix) {
        // Calcola gli offset con la reference matrix attuale
        const offsetMatrices = new Map();
        _assets.forEach((asset, id) => {
            const offset = getOffsetMatrix(_referenceMatrix, asset.matrix);
            offsetMatrices.set(id, offset);
        });

        // Aggiorna la reference matrix
        _referenceMatrix.copy(newReferenceMatrix);

        // Ricalcola e applica le nuove matrici globali
        _assets.forEach((asset, id) => {
            const offset = offsetMatrices.get(id);
            asset.matrix = getGlobalMatrixFromOffsetMatrix(_referenceMatrix, offset);

            // Applica la nuova matrice al mesh se è caricato
            if (asset.isLoaded && asset.mesh) {
                asset.applyMatrixToMesh();
            }
        });
    },

    initialized() {
        return _initialized;
    }
}
export default AssetManager;