import * as THREE from "three";
import { Plane, Vector3, Box3, Clock } from 'three';

export default class ClippingPlaneReveal {
    constructor(model, renderer, options = {}) {
        this.model = model;
        this.renderer = renderer;

        // Opzioni configurabili
        this.duration = options.duration || 3.0;
        this.direction = options.direction || 'up'; // 'up', 'down', 'left', 'right', 'forward', 'backward'
        this.showBelow = options.showBelow !== undefined ? options.showBelow : true; // mostra la parte sotto/dietro il piano
        this.easingFunction = options.easingFunction || this.easeOut;
        this.autoStart = options.autoStart !== undefined ? options.autoStart : true;
        this.startDelay = options.startDelay || 0;
        this.padding = options.padding || 0.1;

        // Variabili interne
        // this.model = null;
        // this.renderer = null;
        this.clippingPlane = null;
        this.modelBoundingBox = null;
        this.clock = new Clock();
        this.startTime = 0;
        this.isRevealing = false;
        this.isSetup = false;

        // Callbacks
        this.onStart = options.onStart || (() => { });
        this.onUpdate = options.onUpdate || (() => { });
        this.onComplete = options.onComplete || (() => { });

        this._init();
    }

    // Funzioni di easing predefinite
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeIn(t) {
        return t * t * t;
    }

    easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    linear(t) {
        return t;
    }

    // Calcola normale e parametri in base alla direzione
    getDirectionParams() {
        const params = {
            normal: new Vector3(),
            getMin: () => 0,
            getMax: () => 0
        };

        switch (this.direction) {
            case 'up':
                params.normal.set(0, this.showBelow ? -1 : 1, 0);
                params.getMin = () => this.modelBoundingBox.min.y;
                params.getMax = () => this.modelBoundingBox.max.y;
                break;
            case 'down':
                params.normal.set(0, this.showBelow ? 1 : -1, 0);
                params.getMin = () => this.modelBoundingBox.max.y;
                params.getMax = () => this.modelBoundingBox.min.y;
                break;
            case 'right':
                params.normal.set(this.showBelow ? -1 : 1, 0, 0);
                params.getMin = () => this.modelBoundingBox.min.x;
                params.getMax = () => this.modelBoundingBox.max.x;
                break;
            case 'left':
                params.normal.set(this.showBelow ? 1 : -1, 0, 0);
                params.getMin = () => this.modelBoundingBox.max.x;
                params.getMax = () => this.modelBoundingBox.min.x;
                break;
            case 'forward':
                params.normal.set(0, 0, this.showBelow ? -1 : 1);
                params.getMin = () => this.modelBoundingBox.min.z;
                params.getMax = () => this.modelBoundingBox.max.z;
                break;
            case 'backward':
                params.normal.set(0, 0, this.showBelow ? 1 : -1);
                params.getMin = () => this.modelBoundingBox.max.z;
                params.getMax = () => this.modelBoundingBox.min.z;
                break;
        }

        return params;
    }

    // Setup del clipping plane
    _init() {

        // Calcola il bounding box del modello
        this.modelBoundingBox = new Box3().setFromObject(this.model);

        // Ottieni i parametri di direzione
        const dirParams = this.getDirectionParams();

        // Crea il clipping plane
        const initialValue = dirParams.getMin() - this.padding;
        this.clippingPlane = new Plane(dirParams.normal, initialValue);

        // Abilita il clipping nel renderer
        this.renderer.localClippingEnabled = true;

        // Applica il clipping plane a tutti i materiali del modello
        this.model.traverse((child) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.clippingPlanes = [this.clippingPlane];
                        mat.side = THREE.DoubleSide;
                    });
                } else {
                    child.material.clippingPlanes = [this.clippingPlane];
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        this.isSetup = true;

        // Auto start se abilitato
        if (this.autoStart) {
            if (this.startDelay > 0) {
                setTimeout(() => this.start(), this.startDelay);
            } else {
                this.start();
            }
        }

        return this;
    }

    // Avvia l'animazione
    start() {
        if (!this.isSetup) {
            console.warn('ClippingPlaneReveal: setup() deve essere chiamato prima di start()');
            return this;
        }

        if (!this.isRevealing) {
            this.isRevealing = true;
            this.startTime = this.clock.getElapsedTime();
            this.onStart();
        }

        return this;
    }

    // Ferma l'animazione
    stop() {
        this.isRevealing = false;
        return this;
    }

    // Reset dell'animazione
    reset() {
        if (!this.isSetup) return this;

        const dirParams = this.getDirectionParams();
        const initialValue = dirParams.getMin() - this.padding;
        this.clippingPlane.constant = initialValue;
        this.isRevealing = false;

        return this;
    }

    // Restart dell'animazione
    restart() {
        this.reset();
        this.start();
        return this;
    }

    // Update da chiamare nel loop di animazione
    update() {
        if (!this.isRevealing || !this.isSetup) return;

        const elapsedTime = this.clock.getElapsedTime() - this.startTime;
        const progress = Math.min(elapsedTime / this.duration, 1.0);

        // Applica la funzione di easing
        const easedProgress = this.easingFunction(progress);

        // Calcola la posizione corrente del piano
        const dirParams = this.getDirectionParams();
        const minVal = dirParams.getMin() - this.padding;
        const maxVal = dirParams.getMax() + this.padding;
        const currentVal = minVal + (maxVal - minVal) * easedProgress;

        // Aggiorna la costante del piano
        this.clippingPlane.constant = currentVal;

        // Callback di update
        this.onUpdate(progress, easedProgress);

        // Controlla se l'animazione è completata
        if (progress >= 1.0) {
            this.isRevealing = false;
            this.onComplete();
        }
    }

    // Getter per lo stato
    get isAnimating() {
        return this.isRevealing;
    }

    get progress() {
        if (!this.isRevealing) return this.isSetup ? 1.0 : 0.0;
        const elapsedTime = this.clock.getElapsedTime() - this.startTime;
        return Math.min(elapsedTime / this.duration, 1.0);
    }

    // Setter per modificare opzioni durante l'esecuzione
    setDuration(duration) {
        this.duration = duration;
        return this;
    }

    setDirection(direction) {
        this.direction = direction;
        if (this.isSetup) {
            // Ricrea il clipping plane con la nuova direzione
            const dirParams = this.getDirectionParams();
            this.clippingPlane.normal.copy(dirParams.normal);
            if (!this.isRevealing) {
                this.reset();
            }
        }
        return this;
    }

    setEasing(easingFunction) {
        this.easingFunction = easingFunction;
        return this;
    }

    // Cleanup
    dispose() {
        if (this.model && this.clippingPlane) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.clippingPlanes) {
                                mat.clippingPlanes = [];
                            }
                        });
                    } else {
                        if (child.material.clippingPlanes) {
                            child.material.clippingPlanes = [];
                        }
                    }
                }
            });
        }

        this.clippingPlane = null;
        this.model = null;
        this.renderer = null;
        this.isSetup = false;
        this.isRevealing = false;
    }
}