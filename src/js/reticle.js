import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    Vector3,
    Quaternion,
    Matrix4,
    PlaneGeometry,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
} from 'three';
import SceneManager from "./sceneManager";


let _renderer = null;
let _scene = null;
let _camera = null;
let _planeMesh = null;
let _circleMesh = null;

// Elementi di stato
let _hitTestSource = null;
let _hitTestSourceRequested = false;
let _isHitting = false;
let _surfType = null;
let _visible = false;
let _reticleMode = null;


// Variabili per il Piano di riferimento per l'orientamento del reticolo
let _geomLookAt = null;
let _reticleLookAt = null;
let _reticleWorldPosition = new Vector3();
let _reticleLookAtWorldPosition = new Vector3();
let _reticleDirection = new Vector3();

let _initialized = false;


function _addPlaneForReticleSurface() {
    _geomLookAt = new PlaneGeometry(0.1, 0.1);
    _reticleLookAt = new Mesh(
        _geomLookAt.rotateX(- Math.PI / 2),
        new MeshBasicMaterial({ color: 0xff0000 })
    );
    _reticleLookAt.translateY(.3);
    _reticleLookAt.visible = false;
    _planeMesh.add(_reticleLookAt);
}


function _getReticleSurface() {
    _reticleLookAt.getWorldPosition(_reticleWorldPosition);
    _planeMesh.getWorldPosition(_reticleLookAtWorldPosition);
    _reticleDirection.subVectors(_reticleWorldPosition, _reticleLookAtWorldPosition).normalize();
    if (_reticleDirection.y == 1) {
        return 'floor';
    } else if (_reticleDirection.y == -1) {
        return 'ceiling';
    } else {
        return 'wall';
    }
}


function _alignZAxisWithUp() {
    // Calcola l'attuale direzione dell'asse Z della mesh
    const zAxis = new Vector3(0, 0, 1);
    zAxis.applyQuaternion(_planeMesh.quaternion);
    // Vettore di riferimento per "l'alto" (solitamente l'asse Y nel sistema di coordinate globale)
    const upVector = new Vector3(0, -1, 0);
    // Calcola l'angolo tra l'asse Z attuale e il vettore UP
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(zAxis, upVector);
    // Applica questa rotazione correttiva
    _planeMesh.quaternion.premultiply(quaternion);
    // Aggiorna la matrice dell'oggetto
    _planeMesh.updateMatrix();
}


function _setReticleProperties() {
    _planeMesh.matrixAutoUpdate = false;
    _planeMesh.visible = false;
    _scene.add(_planeMesh);
    _addPlaneForReticleSurface();
    _initialized = true;
}


const _options = {
    radius: 0.2,
    innerRadius: 0.1,
    segments: 32,
    color: 0x00ff00
}

const MODE = {
    PLANE: 'plane',
    FREE: 'free'
}




const Reticle = {
    /**
     * Configura le opzioni per l'oggetto XrReticle.
     *
     * @param {Object} [options={}] - Oggetto delle opzioni di configurazione.
     * @param {WebGLRenderer} [options.renderer] - Il renderer da utilizzare.
     * @param {Scene} [options.scene] - La scena a cui aggiungere il reticolo.
     * @param {Camera} [options.camera] - La camera a cui aggiungere il cerchio.
     * @param {string} [options.fileName] - Il percorso del file GLTF da caricare come mesh del reticolo.
     * @param {number} [options.radius] - Il raggio esterno del reticolo.
     * @param {number} [options.innerRadius] - Il raggio interno del reticolo.
     * @param {number} [options.segments] - Il numero di segmenti del reticolo.
     * @param {number} [options.color] - Il colore del reticolo.
     */
    set(options = {}) {
        _initialized = false;
        _renderer = SceneManager.renderer;
        _scene = SceneManager.scene;
        _camera = SceneManager.camera;

        if (!SceneManager.initialized() || !_renderer || !_scene || !_camera) {
            console.error("XrReticle: renderer or scene not set");
            alert("XrReticle: renderer or scene not set")
            return;
        }

        if (options.radius) _options.radius = options.radius;
        if (options.innerRadius) _options.innerRadius = options.innerRadius;
        if (options.segments) _options.segments = options.segments;
        if (options.color) _options.color = options.color;

        if (options.fileName) {
            console.log("loading GLTF")
            const loader = new GLTFLoader();
            loader.load(
                options.fileName,
                (gltf) => {
                    const r = gltf.scene;
                    const ref = r.children[0];
                    _planeMesh = ref.clone();
                    _setReticleProperties();
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total * 100) + '% loaded of reticle');
                },
                (error) => {
                    console.error('An error happened', error);
                }
            );



        }
        else {
            const ringGeometry = new RingGeometry(_options.innerRadius, _options.radius, _options.segments).rotateX(-Math.PI / 2);
            const material = new MeshBasicMaterial({ color: _options.color || 0xffffff });
            _planeMesh = new Mesh(ringGeometry, material);
            _setReticleProperties();
        }

        // Add the circle in front of the camera
        // to use in place of plane detection
        const circleGeometry = new RingGeometry(0, 0.02, 24);
        const circleMaterial = new MeshBasicMaterial({ color: 0xffffff });
        _circleMesh = new Mesh(circleGeometry, circleMaterial);
        _camera.add(_circleMesh);
        _circleMesh.position.z = -1;
        _scene.add(_camera);

        // At the end, we set the default mode
        this.setUsePlaneDetection(true)
    },

    /**
     * Updates the reticle's position and visibility based on the current XR frame's hit test results.
     *
     * @param {XRFrame} frame - The current XRFrame from the XR session.
     * @param {function} [callback] - Optional callback invoked with the detected surface type ('wall', 'floor', etc.) after a successful hit test.
     *
     * @returns {void}
     */
    update(frame, callback) {
        if (!_visible) {
            _planeMesh.visible = false;
            _circleMesh.visible = false;
            return;
        }

        const referenceSpace = _renderer.xr.getReferenceSpace();


        // Update camera from pose (used from CircleMesh)
        if (_reticleMode === MODE.FREE) {
            _planeMesh.visible = false;
            _circleMesh.visible = true;
            const framePose = frame.getViewerPose(referenceSpace);
            if (framePose) {
                const position = framePose.transform.position;
                const rotation = framePose.transform.orientation;
                _camera.position.set(position.x, position.y, position.z);
                _camera.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                _camera.updateMatrixWorld();
            }
        }


        // Check for hit source (used from PlaneMesh)
        else if (_reticleMode === MODE.PLANE) {
            _circleMesh.visible = false;

            const session = _renderer.xr.getSession();

            if (_hitTestSourceRequested === false) {
                session.requestReferenceSpace("viewer").then(function (referenceSpace) {
                    session
                        .requestHitTestSource({ space: referenceSpace })
                        .then(function (source) {
                            _hitTestSource = source;
                        });
                });

                session.addEventListener("end", function () {
                    _hitTestSourceRequested = false;
                    _hitTestSource = null;
                });

                _hitTestSourceRequested = true;
            }

            if (_hitTestSource) {
                const hitTestResults = frame.getHitTestResults(_hitTestSource);
                if (hitTestResults.length) {

                    _isHitting = true;
                    _planeMesh.visible = true;

                    const hit = hitTestResults[0];
                    const pose = hit.getPose(referenceSpace);
                    const rawMatrix = pose.transform.matrix;
                    const threeMatrix = new Matrix4();
                    threeMatrix.fromArray(rawMatrix);
                    let pos = new Vector3();
                    let quat = new Quaternion();
                    let scale = new Vector3();
                    threeMatrix.decompose(pos, quat, scale);
                    _planeMesh.position.copy(pos);
                    _planeMesh.quaternion.copy(quat);
                    _planeMesh.updateMatrix(); ////// NON QUI!!!!!!!!

                    _surfType = _getReticleSurface();
                    if (_surfType == 'wall' && !window.iOS) _alignZAxisWithUp();

                    if (callback) callback(_surfType);

                } else {
                    _isHitting = false;
                    _planeMesh.visible = false;
                    _surfType = null;
                }
            }
        }
    },

    destroy() {
        // Cleanup della planeMesh e dei suoi children
        if (_planeMesh) {
            // Rimuovi dalla scena
            if (_scene) {
                _scene.remove(_planeMesh);
            }

            // Cleanup del _reticleLookAt se presente
            if (_reticleLookAt) {
                _planeMesh.remove(_reticleLookAt);
                if (_reticleLookAt.geometry) _reticleLookAt.geometry.dispose();
                if (_reticleLookAt.material) _reticleLookAt.material.dispose();
                _reticleLookAt = null;
            }

            // Dispose della geometria e materiale della planeMesh
            if (_planeMesh.geometry) _planeMesh.geometry.dispose();
            if (_planeMesh.material) {
                if (Array.isArray(_planeMesh.material)) {
                    _planeMesh.material.forEach(material => material.dispose());
                } else {
                    _planeMesh.material.dispose();
                }
            }
            _planeMesh = null;
        }

        // Cleanup della circleMesh
        if (_circleMesh) {
            // Rimuovi dalla camera
            if (_camera) {
                _camera.remove(_circleMesh);
            }

            // Dispose della geometria e materiale
            if (_circleMesh.geometry) _circleMesh.geometry.dispose();
            if (_circleMesh.material) _circleMesh.material.dispose();
            _circleMesh = null;
        }

        // Cleanup della geometria _geomLookAt
        if (_geomLookAt) {
            _geomLookAt.dispose();
            _geomLookAt = null;
        }

        // Cleanup dell'hit test source
        if (_hitTestSource) {
            // Non c'è un metodo dispose esplicito per hitTestSource,
            // ma resettiamo la variabile
            _hitTestSource = null;
        }

        // Reset di tutte le variabili di stato
        _hitTestSourceRequested = false;
        _isHitting = false;
        _surfType = null;
        _visible = false;
        _reticleMode = null;
        _initialized = false;

        // Reset dei riferimenti
        _renderer = null;
        _scene = null;
        _camera = null;

        console.log("Reticle destroyed successfully");
    },

    initialized() {
        return _initialized;
    },

    isHitting() {
        if (!_initialized) {
            console.error("Reticle is not set");
            return;
        }
        return _isHitting;
    },

    getHitMatrix() {
        if (!_initialized) {
            console.error("Reticle is not set");
            return;
        }
        if (_reticleMode === MODE.PLANE) return _planeMesh.matrix;
        return _circleMesh.matrixWorld;
    },

    setVisible(value) {
        _visible = value;
    },

    visible() {
        return _visible;
    },

    surfType() {
        return _surfType;
    },

    setUsePlaneDetection(value) {
        _reticleMode = value ? MODE.PLANE : MODE.FREE;
    },
}

export default Reticle;   