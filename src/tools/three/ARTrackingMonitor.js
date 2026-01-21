class ARTrackingMonitor {
    constructor(sampleSize = 30) {
        this.sampleSize = sampleSize;
        this.statusHistory = []; 
        this.isTrackingLow = false;
        this.eventTarget = new EventTarget();
    }

    /**
     * @param {XRFrame} frame - Passato dal loop di Three.js
     * @param {THREE.WebGLRenderer} renderer - Il renderer della tua app
     */
    update(frame, renderer) {
        if (!frame || !renderer) return;

        // Recupera il referenceSpace e la pose internamente
        const referenceSpace = renderer.xr.getReferenceSpace();
        const pose = frame.getViewerPose(referenceSpace);

        // Se la pose è null (es. sensori oscurati), consideriamo il tracking emulato/perso
        const isCurrentlyEmulated = pose ? pose.emulatedPosition : true;

        this.statusHistory.push(isCurrentlyEmulated);

        if (this.statusHistory.length > this.sampleSize) {
            this.statusHistory.shift();
        }

        if (this.statusHistory.length >= this.sampleSize) {
            const emulatedFrames = this.statusHistory.filter(status => status === true).length;
            const isDegraded = emulatedFrames > (this.sampleSize / 2);

            if (isDegraded && !this.isTrackingLow) {
                this.isTrackingLow = true;
                this.triggerTrackingEvent('lowtracking');
            } else if (!isDegraded && this.isTrackingLow) {
                this.isTrackingLow = false;
                this.triggerTrackingEvent('normaltracking');
            }
        }
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