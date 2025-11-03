import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer, Clock } from 'three';
import { RecreateMaterials } from "./materialTools";


export class GLBFile {
    constructor(fileUrl, options = {}) {
        this.fileUrl = fileUrl;
        this.options = options;
        this.loader = new GLTFLoader()
        const draco = new DRACOLoader()
        draco.setDecoderConfig({ type: "js" })
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
        this.loader.setDRACOLoader(draco)
        this.mixers = [];
        this.actions = [];
        this.clock = null;
        this.gltf = null;
        this.model = null;

        this._loaded = false;
        return this._init();
    }

    async _init() {
        this.model = await this._loadModel();
        return this;
    }


    async _loadModel() {
        console.log("carico:", this.fileUrl)
        this.gltf = await this.loader.loadAsync(this.fileUrl);
        let model = this.gltf.scene;

        // we need to recreate materials
        // because often the model have physical materials, double side, etc
        // and in AR it get worse!!!
        model = RecreateMaterials(model, {
            aoMap: this.options.aoMap || null,
            aoMapIntensity: this.options.aoMapIntensity || 1,
            aoMapChannel: this.options.aoMapChannel || 0,
            lightMap: this.options.lightMap || null,
            lightMapChannel: this.options.lightMapChannel || 0,
        });

        this._setupAnimations(model, false);
        this._loaded = true;
        return model;
    }

    clone(options = {}) {
        const randomizeTime = options.randomizeTime ?? false;
        const newModel = this.model.clone(true);

        if (options.position) newModel.position.copy(options.position);
        if (options.rotation) newModel.rotation.copy(options.rotation);
        if (options.scale) newModel.scale.copy(options.scale);

        this._setupAnimations(newModel, randomizeTime);

        return newModel;
    }

    animate() {
        if (this.mixers.length > 0) {
            const dt = this.clock.getDelta();
            this.mixers.forEach(mixer => mixer.update(dt));
        }
        else {
            console.warn("You want to animate an object with NO animations!")
        }
    }

    resetAnimations() {
        this.actions.forEach(mixerActions => {
            mixerActions.forEach(action => {
                action.reset();
                action.play();
            });
        });

        if (this.mixers.length > 0) {
            // Forza un update con deltaTime = 0 per applicare il frame corrente
            this.mixers.forEach(mixer => mixer.update(0));
        }

        this.clock = new Clock();
    }

    loaded() {
        return this._loaded;
    }

    _setupAnimations(model, randomizeTime) {
        if (this.gltf.animations.length > 0) {
            if (!this.clock) this.clock = new Clock();
            const mixer = new AnimationMixer(model);
            const mixerActions = []; // Azioni specifiche per questo mixer

            this.gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();

                // Shift casuale dell'animazione
                if (randomizeTime) action.time = Math.random() * clip.duration;

                mixerActions.push(action);
            });

            this.mixers.push(mixer);
            this.actions.push(mixerActions);
        }
    }
}


export function findUserDataKey(root, key) {
    let found = null;

    root.traverse(obj => {
        if (found || !obj.userData) return;

        const seen = new WeakSet();
        function search(node, path = []) {
            if (found) return;
            if (node && typeof node === 'object') {
                if (seen.has(node)) return;
                seen.add(node);

                for (const k of Object.keys(node)) {
                    const newPath = path.concat(k);
                    if (k === key) {
                        found = {
                            object: obj,
                            path: newPath.join('.'),
                            value: node[k]
                        };
                        return;
                    }
                    const val = node[k];
                    if (val && typeof val === 'object') {
                        search(val, newPath);
                        if (found) return;
                    }
                }
            }
        }

        search(obj.userData, []);
    });

    return found; // null se non trovato
}

// export function getAllMaterials(gltf) {
//     const materialMap = {};
//     gltf.scene.traverse((node) => {
//         if (node.isMesh) {

//             // Trova l'indice del materiale nel GLTF
//             const matIndex = gltf.parser.associations.get(node.material)?.materials;
//             console.log("SIIIIIIIIIIIIIIIIIIIIIIII", matIndex)
//             if (matIndex !== undefined) {
//                 const matName = gltf.parser.json.materials[matIndex].name;
//                 materialMap[matName] = node.material;
//             }
//         }
//         else{
//             console.log("NOOOOOOOOOOOOOOOOOOOOO")
//         }
//     });
//     return materialMap
// }

export async function getAllMaterials(gltf) {
    const materialMap = {};

    // Prendi tutti i materiali direttamente dal parser JSON
    const materialsData = gltf.parser.json.materials;

    // Carica tutti i materiali usando il parser
    for (let i = 0; i < materialsData.length; i++) {
        const matName = materialsData[i].name;
        const material = await gltf.parser.getDependency('material', i);
        if (matName) {
            materialMap[matName] = material;
        }
    }
    return materialMap
}




