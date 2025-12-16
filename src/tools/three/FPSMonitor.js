class FPSMonitor {
    constructor(threshold = 15, sampleSize = 60) {
        this.threshold = threshold;
        this.sampleSize = sampleSize;
        this.frames = [];
        this.lastTime = performance.now();
        this.isLowFPS = false;
        this.eventTarget = new EventTarget();
        
        // // JUST FOR TEST
        // setTimeout(() => {
        //     this.triggerLowFPSEvent(11);
        // }, 7000);
    }

    // Chiamare questo metodo in ogni frame (es. dentro il loop di render di Three.js)
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        // Calcola FPS corrente
        const currentFPS = 1000 / delta;
        this.frames.push(currentFPS);

        // Mantieni solo gli ultimi N frame
        if (this.frames.length > this.sampleSize) {
            this.frames.shift();
        }

        // Calcola media FPS
        if (this.frames.length >= this.sampleSize) {
            const avgFPS = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;

            // Controlla se siamo sotto la soglia
            if (avgFPS < this.threshold && !this.isLowFPS) {
                this.isLowFPS = true;
                this.triggerLowFPSEvent(avgFPS);
            } else if (avgFPS >= this.threshold && this.isLowFPS) {
                this.isLowFPS = false;
                this.triggerNormalFPSEvent(avgFPS);
            }
        }

        return this.getCurrentFPS();
    }

    // Ottieni l'FPS corrente medio
    getCurrentFPS() {
        if (this.frames.length === 0) return 60;
        return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    }

    // Trigger evento quando FPS scende sotto la soglia
    triggerLowFPSEvent(fps) {
        const event = new CustomEvent('lowfps', {
            detail: { fps, threshold: this.threshold }
        });
        this.eventTarget.dispatchEvent(event);
    }

    // Trigger evento quando FPS torna normale
    triggerNormalFPSEvent(fps) {
        const event = new CustomEvent('normalfps', {
            detail: { fps, threshold: this.threshold }
        });
        this.eventTarget.dispatchEvent(event);
    }

    // Metodo per ascoltare gli eventi
    on(eventName, callback) {
        this.eventTarget.addEventListener(eventName, callback);
    }

    // Metodo per rimuovere listener
    off(eventName, callback) {
        this.eventTarget.removeEventListener(eventName, callback);
    }
}

// Esempio di utilizzo con Three.js:
/*
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Inizializza il monitor FPS con soglia di 15 FPS
const fpsMonitor = new FPSMonitor(15, 60);

// Ascolta l'evento di FPS bassi
fpsMonitor.on('lowfps', (e) => {
  console.warn(`FPS troppo bassi! FPS corrente: ${e.detail.fps.toFixed(2)}`);
  // Qui puoi ridurre la qualità grafica, disabilitare effetti, etc.
});

// Ascolta quando l'FPS torna normale
fpsMonitor.on('normalfps', (e) => {
  console.log(`FPS tornati normali: ${e.detail.fps.toFixed(2)}`);
  // Qui puoi ripristinare la qualità grafica
});

function animate() {
  requestAnimationFrame(animate);
  
  // Aggiorna il monitor FPS
  const currentFPS = fpsMonitor.update();
  
  // Il tuo codice di rendering Three.js
  renderer.render(scene, camera);
}

animate();
*/

export default FPSMonitor;