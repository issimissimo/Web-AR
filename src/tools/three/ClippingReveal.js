import { Plane, Vector3, Box3, Clock, DoubleSide } from 'three';
import ConcentricRings from './ConcentricRings.js';


export default class ClippingReveal {
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
        this.padding = options.padding || 0.001;
        this.fadeOutDuration = options.fadeOutDuration || 0.5; // Durata dissolvenza in secondi
        this.audio = options.audio || null;

        // Opzioni per ConcentricRings
        this.ringsRadius = options.ringsRadius || 0.5; // Raggio degli anelli
        this.ringsColor = options.ringsColor || 0xff69b4; // Rosa
        this.numRings = options.ringNumber || 5;
        this.ringThickness = options.ringThickness || 0.1;

        // Variabili interne
        this.clippingPlane = null;
        this.concentricRings = null;
        this.modelBoundingBox = null;
        this.clock = new Clock();
        this.startTime = 0;
        this.isRevealing = false;
        this.isSetup = false;
        this.scene = null;

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

    // Crea gli anelli concentrici
    _createConcentricRings() {

        // Crea gli anelli concentrici
        this.concentricRings = new ConcentricRings(
            this.ringsRadius,
            this.ringsColor,
            this.numRings,
            this.ringThickness
        );

        // Orienta gli anelli in base alla direzione
        this._orientConcentricRings();

        // Posiziona gli anelli alla posizione iniziale
        this._updateRingsPosition();

        // Trova la scena (assumiamo che il modello sia già stato aggiunto alla scena)
        let parent = this.model.parent;
        while (parent && parent.type !== 'Scene') {
            parent = parent.parent;
        }
        this.scene = parent;

        if (this.scene) {
            this.scene.add(this.concentricRings);
        } else {
            console.warn('ClippingPlaneReveal: Impossibile trovare la scena per aggiungere gli anelli concentrici');
        }
    }

    // Orienta gli anelli concentrici in base alla direzione
    _orientConcentricRings() {
        if (!this.concentricRings) return;

        // Reset della rotazione
        this.concentricRings.rotation.set(0, 0, 0);

        switch (this.direction) {
            case 'up':
            case 'down':
                // Gli anelli sono già orizzontali (XZ plane)
                break;
            case 'left':
            case 'right':
                // Ruota per essere verticale lungo X (YZ plane)
                this.concentricRings.rotation.z = Math.PI / 2;
                break;
            case 'forward':
            case 'backward':
                // Ruota per essere verticale frontale (XY plane)
                this.concentricRings.rotation.x = Math.PI / 2;
                break;
        }
    }

    // Aggiorna la posizione degli anelli concentrici
    _updateRingsPosition() {
        if (!this.concentricRings || !this.clippingPlane) return;

        // Calcola la posizione attuale basata sulla costante del clipping plane
        const currentValue = this.clippingPlane.constant;

        // Posiziona gli anelli concentrici
        switch (this.direction) {
            case 'up':
            case 'down':
                this.concentricRings.position.y = currentValue;
                // this.concentricRings.position.x = this.modelBoundingBox.getCenter(new Vector3()).x;
                // this.concentricRings.position.z = this.modelBoundingBox.getCenter(new Vector3()).z;
                this.concentricRings.position.x = this.model.position.x
                this.concentricRings.position.z = this.model.position.z
                break;
            case 'left':
            case 'right':
                this.concentricRings.position.x = currentValue;
                this.concentricRings.position.y = this.modelBoundingBox.getCenter(new Vector3()).y;
                this.concentricRings.position.z = this.modelBoundingBox.getCenter(new Vector3()).z;
                break;
            case 'forward':
            case 'backward':
                this.concentricRings.position.z = currentValue;
                this.concentricRings.position.x = this.modelBoundingBox.getCenter(new Vector3()).x;
                this.concentricRings.position.y = this.modelBoundingBox.getCenter(new Vector3()).y;
                break;
        }
    }

    // Aggiorna l'opacità degli anelli per la dissolvenza
    _updateRingsOpacity(progress) {
        if (!this.concentricRings) return;

        // Calcola quando inizia la dissolvenza (negli ultimi fadeOutDuration secondi)
        const fadeStartProgress = 1.0 - (this.fadeOutDuration / this.duration);

        if (progress >= fadeStartProgress) {
            this.concentricRings.fadeOutCascade(200, 200);
        }
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
                        mat.side = DoubleSide;
                    });
                } else {
                    child.material.clippingPlanes = [this.clippingPlane];
                    child.material.side = DoubleSide;
                }
            }
        });

        // Crea gli anelli concentrici
        this._createConcentricRings();

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
        if (!this.isRevealing) {
            this.isRevealing = true;
            this.startTime = this.clock.getElapsedTime();
            this.onStart();

            if (this.audio) this.audio.play();
        }

        return this;
    }


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

        // Aggiorna gli anelli concentrici
        this._updateRingsPosition();
        this._updateRingsOpacity(progress);

        // Callback di update
        this.onUpdate(progress, easedProgress);

        // Controlla se l'animazione è completata
        if (progress >= 1.0) {
            this.isRevealing = false;
            this.onComplete();

            this.dispose();
        }
    }

    get progress() {
        if (!this.isRevealing) return this.isSetup ? 1.0 : 0.0;
        const elapsedTime = this.clock.getElapsedTime() - this.startTime;
        return Math.min(elapsedTime / this.duration, 1.0);
    }

    setDirection(direction) {
        this.direction = direction;
        if (this.isSetup) {
            // Ricrea il clipping plane con la nuova direzione
            const dirParams = this.getDirectionParams();
            this.clippingPlane.normal.copy(dirParams.normal);

            // Riorienta gli anelli concentrici
            if (this.concentricRings) {
                this._orientConcentricRings();
            }

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

    dispose() {
        // Rimuovi gli anelli concentrici dalla scena
        if (this.concentricRings && this.scene) {
            this.scene.remove(this.concentricRings);
            this.concentricRings.dispose();
            this.concentricRings = null;
        }

        // Cleanup del clipping plane
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
        this.scene = null;
        this.isSetup = false;
        this.isRevealing = false;
    }
}