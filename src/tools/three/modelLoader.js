import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer, Clock } from 'three';

class modelLoader {
    constructor() {
        this.loader = new GLTFLoader()
        const draco = new DRACOLoader()
        draco.setDecoderConfig({ type: "js" })
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
        this.loader.setDRACOLoader(draco)
        this.mixers = [];
        this.actions = []; // Nuovo array per tenere traccia delle azioni
        this.clock = null;
        this.gltf = null;
        this.model = null;
        this._loaded = false;
    }

    _setupAnimations(model, randomizeTime) {
        if (this.gltf.animations.length > 0) {
            // if (!this.clock) this.clock = new Clock();
            this.clock = new Clock();
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

    async load(fileUrl, options = {}) {
        const randomizeTime = options.randomizeTime ?? false;
        this.gltf = await this.loader.loadAsync(fileUrl);
        this.model = this.gltf.scene;
        this._setupAnimations(this.model, randomizeTime);
        this._loaded = true;
        return this.model;
    }

    clone(options = {}) {
        const randomizeTime = options.randomizeTime ?? false;
        const newModel = this.model.clone(true);
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

    stopAnimate() {
        this.mixers.forEach(mixer => mixer.stopAllAction());
    }

    // Nuova funzione per resettare le animazioni al frame 0
    resetAnimations() {
        this.actions.forEach(mixerActions => {
            mixerActions.forEach(action => {
                action.reset(); // Resetta l'azione al frame 0
                action.play(); // Riavvia l'animazione dal frame 0
            });
        });
        console.log("spero si siano resettate...")
    }

    // Funzione per fermare e resettare al frame 0
    stopAndReset() {
        this.actions.forEach(mixerActions => {
            mixerActions.forEach(action => {
                action.stop(); // Ferma l'azione
                action.reset(); // Resetta al frame 0
            });
        });
        console.log("spero si siano stoppate...")
    }

    // Funzione per mettere in pausa (senza resettare)
    pauseAnimations() {
        this.actions.forEach(mixerActions => {
            mixerActions.forEach(action => {
                action.paused = true;
            });
        });
    }

    // Funzione per riprendere le animazioni
    resumeAnimations() {
        this.actions.forEach(mixerActions => {
            mixerActions.forEach(action => {
                action.paused = false;
            });
        });
    }

    loaded() {
        return this._loaded;
    }
}

export default modelLoader;