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
        this.clock = null;
        this.gltf = null;
        this.model = null;
        this._loaded = false;
    }

    _setupAnimations(model) {
        if (this.gltf.animations.length > 0) {
            if (!this.clock) this.clock = new Clock();
            const mixer = new AnimationMixer(model);
            this.gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();

                // Shift casuale dell’animazione
                action.time = Math.random() * clip.duration;
            });
            this.mixers.push(mixer);
        }
    }

    async load(fileUrl) {
        this.gltf = await this.loader.loadAsync(fileUrl);
        this.model = this.gltf.scene;
        this._setupAnimations(this.model);
        this._loaded = true;
        return this.model;
    }


    clone() {
        const newModel = this.model.clone(true);
        this._setupAnimations(newModel);
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

    loaded() {
        return this._loaded;
    }
}

export default modelLoader;