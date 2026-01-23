class ARTrackingMonitor {
    constructor(sampleSize = 30) {
        this.sampleSize = sampleSize;
        this.statusHistory = [];
        this.isTrackingLow = false;
        this.eventTarget = new EventTarget();
        this.isWarmUpComplete = false;
    }

    /**
     * @param {XRFrame} frame - Passato dal loop di Three.js
     * @param {THREE.WebGLRenderer} renderer - Il renderer della tua app
     */
    update(frame, renderer) {
        if (!frame || !renderer) return;

        const referenceSpace = renderer.xr.getReferenceSpace();
        const pose = frame.getViewerPose(referenceSpace);

        // Se la pose è null o emulated, il tracking è instabile
        const isCurrentlyEmulated = pose ? pose.emulatedPosition : true;

        this.statusHistory.push(isCurrentlyEmulated);

        if (this.statusHistory.length > this.sampleSize) {
            this.statusHistory.shift();
        }

        // 1. Aspetta che il buffer sia pieno
        if (this.statusHistory.length < this.sampleSize) {
            return;
        }

        // 2. CALCOLO DELLO STATO ATTUALE
        const emulatedFrames = this.statusHistory.filter(status => status === true).length;
        const isDegraded = emulatedFrames > (this.sampleSize / 2);

        // 3. LOGICA DI WARM-UP (Il "Trick" elegante)
        // Se è la prima volta che il buffer è pieno e il tracking è ancora scarso,
        // NON triggerare l'evento. Aspettiamo finché non diventa "Normal" per la prima volta.
        if (!this.isWarmUpComplete) {
            if (!isDegraded) {
                this.isWarmUpComplete = true;
                // Opzionale: puoi triggerare 'normaltracking' qui se vuoi conferma dell'aggancio
            }
            return; // Esci senza fare nulla finché non siamo stabili la prima volta
        }

        // 4. GESTIONE EVENTI STANDARD (Post-Warmup)
        if (isDegraded && !this.isTrackingLow) {
            this.isTrackingLow = true;
            this.triggerTrackingEvent('lowtracking');
        } else if (!isDegraded && this.isTrackingLow) {
            this.isTrackingLow = false;
            this.triggerTrackingEvent('normaltracking');
        }
    }

    reset() {
        this.statusHistory = [];
        this.isTrackingLow = false;
        this.isWarmUpComplete = false;
    }

    triggerTrackingEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: {
                isEmulated: this.isTrackingLow,
                timestamp: performance.now()
            }
        });
        this.eventTarget.dispatchEvent(event);
    }

    on(eventName, callback) {
        this.eventTarget.addEventListener(eventName, callback);
    }

    off(eventName, callback) {
        this.eventTarget.removeEventListener(eventName, callback);
    }
}

export default ARTrackingMonitor;