import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer, Clock } from 'three';
import { RecreateMaterials } from "./materialTools";

export class GlbLoader {
    constructor() {
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
    }

    async load(fileUrl, options = {}) {
        const randomizeTime = options.randomizeTime ?? false;
        this.gltf = await this.loader.loadAsync(fileUrl);
        this.model = this.gltf.scene;

        // we need to recreate materials
        // because often the model have physical materials, double side, etc
        // and in AR it get worse!!!
        this.model = RecreateMaterials(this.model, {
            aoMap: options.aoMap || null,
            lightMap: options.lightMap || null,
        });

        this._setupAnimations(this.model, randomizeTime);
        this._loaded = true;
        return this.model;
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


export class LoadGLB {
    constructor(fileUrl, options = {}) {
        this.fileUrl = fileUrl;
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
        this.options = options;
        this._loaded = false;
        return this._init();
    }

    async _init() {
        this.model = await this.loadModel();
        return this.model;
    }

    async loadModel() {
        const randomizeTime = this.options.randomizeTime ?? false;
        this.gltf = await this.loader.loadAsync(this.fileUrl);

        let model = this.gltf.scene;

        // we need to recreate materials
        // because often the model have physical materials, double side, etc
        // and in AR it get worse!!!
        model = RecreateMaterials(model, {
            aoMap: this.options.aoMap || null,
            lightMap: this.options.lightMap || null,
        });

        this._setupAnimations(model, randomizeTime);
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

