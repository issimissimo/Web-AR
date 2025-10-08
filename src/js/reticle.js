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
import ConcentricRings from "@tools/three/ConcentricRings";
// import { GlbLoader } from "@tools/three/modelTools";
import { GLBFile } from '@tools/three/modelTools';
import { LoadTexture } from "@tools/three/textureTools";
import { config } from '@js/config';


let _renderer = null;
let _scene = null;
let _camera = null;
let _circleMesh = null;

let _reticleMesh = null;
// const _glbLoader = new GlbLoader();


// Elementi di stato
let _hitTestSource = null;
let _hitTestSourceRequested = false;
let _isHitting = false;
let _surfTypeDetected = null;
let _enabled = true;
let _meshType = null;


let _surfTypeMode = null;
let _workingMode = null;


// Variabili per il Piano di riferimento per l'orientamento del reticolo
let _geomLookAt = null;
let _reticleLookAt = null;
let _reticleWorldPosition = new Vector3();
let _reticleLookAtWorldPosition = new Vector3();
let _reticleDirection = new Vector3();

let _initialized = false;

let _backup = {};

let _reticleStates = [];
let _reticleTimeout = null;


function _addPlaneForReticleSurface() {
    _geomLookAt = new PlaneGeometry(0.1, 0.1);
    _reticleLookAt = new Mesh(
        _geomLookAt.rotateX(- Math.PI / 2),
        new MeshBasicMaterial({ color: 0xff0000 })
    );
    _reticleLookAt.translateY(.3);
    _reticleLookAt.visible = false;
    _reticleMesh.add(_reticleLookAt);
}



function _getReticleSurface() {
    _reticleLookAt.getWorldPosition(_reticleWorldPosition);
    _reticleMesh.getWorldPosition(_reticleLookAtWorldPosition);
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
    zAxis.applyQuaternion(_reticleMesh.quaternion);
    // Vettore di riferimento per "l'alto" (solitamente l'asse Y nel sistema di coordinate globale)
    const upVector = new Vector3(0, -1, 0);
    // Calcola l'angolo tra l'asse Z attuale e il vettore UP
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(zAxis, upVector);
    // Applica questa rotazione correttiva
    _reticleMesh.quaternion.premultiply(quaternion);
    // Aggiorna la matrice dell'oggetto
    _reticleMesh.updateMatrix();
}


function _setReticleProperties() {
    _reticleMesh.matrixAutoUpdate = false;
    _scene.add(_reticleMesh);
    _addPlaneForReticleSurface();

}


const _options = {};



const Reticle = {
    /**
     * XrReticle configuration
     *
     * @param {Object} [options={}] - Oggetto delle opzioni di configurazione.
     * @param {WebGLRenderer} [options.renderer] - Il renderer da utilizzare.
     * @param {Scene} [options.scene] - La scena a cui aggiungere il reticolo.
     * @param {Camera} [options.camera] - La camera a cui aggiungere il cerchio.
     * @param {string} [options.fileName] - Il percorso del file GLTF da caricare come mesh del reticolo.
     * @param {number} [options.radius] - Il raggio esterno del reticolo.
     * @param {number} [options.color] - Il colore del reticolo.
     */


    MESH_TYPE: {
        RINGS: 'rings',
        PLANE: 'plane',
        CUSTOM: 'custom',
    },

    SURF_TYPE_MODE: {
        FLOOR: 'floor',
        WALL: 'wall',
        CEILING: 'ceiling',
        ALL: 'all',
    },

    WORKING_MODE: {
        SURFACE: 'surface',
        TARGET: 'target',
    },


    async setup(meshType, options = {}) {

        if (!SceneManager.initialized()) {
            const errorMsg = "XrReticle: SceneManager not set";
            console.error(errorMsg);
            if (!config.debugOnDesktop) alert(errorMsg);
            return false;
        }

        _initialized = false;
        if (_reticleMesh) _scene.remove(_reticleMesh);


        // main
        _renderer = SceneManager.renderer;
        _scene = SceneManager.scene;
        _camera = SceneManager.camera;

        _meshType = meshType;
        _surfTypeMode = _surfTypeMode || this.SURF_TYPE_MODE.ALL;
        _workingMode = this.WORKING_MODE.SURFACE;

        // options
        _options.size = options.size || 0.4;
        _options.color = options.color || 0x00ff00;
        _options.ringNumber = options.ringNumber || 3;
        _options.ringThickness = options.ringThickness || 0.2;
        _options.glbFilePath = options.glbFilePath || null;
        _options.texturePath = options.texturePath || null;


        switch (_meshType) {

            case this.MESH_TYPE.RINGS:
                console.log("SETTING UP RINGS RETICLE....")
                _reticleMesh = new ConcentricRings(
                    _options.size / 2,
                    _options.color,
                    _options.ringNumber,
                    _options.ringThickness
                );
                this._completeSetup();
                break;


            case this.MESH_TYPE.PLANE:
                console.log("SETTING UP PLANE RETICLE....")
                const opacityTexture = await new LoadTexture(_options.texturePath);
                const planeGeo = new PlaneGeometry(_options.size, _options.size).rotateX(-Math.PI / 2);
                const planeMat = new MeshBasicMaterial({
                    color: _options.color,
                    alphaMap: opacityTexture,
                    transparent: true,
                });
                _reticleMesh = new Mesh(planeGeo, planeMat);
                this._completeSetup();
                break;


            case this.MESH_TYPE.CUSTOM:
                console.log("SETTING UP CUSTOM RETICLE....")
                // _reticleMesh = await _glbLoader.load(_options.glbFilePath);
                const glb = await new GLBFile(_options.glbFilePath);
                _reticleMesh = glb.model;
                this._completeSetup();
                break;

        }
    },

    _completeSetup() {
        // Setup some more properties...
        _setReticleProperties();

        // Add the circle target in front of the camera
        // to use in place of plane detection
        const circleGeometry = new RingGeometry(0, 0.02, 24);
        const circleMaterial = new MeshBasicMaterial({ color: 0xffffff });
        _circleMesh = new Mesh(circleGeometry, circleMaterial);
        _camera.add(_circleMesh);
        _circleMesh.position.z = -1;
        _scene.add(_camera);

        // We don't want to set the Reticle visible right now!
        // Let the user to set it later...
        this.setVisible(false);

        _initialized = true;
    },

    update(frame, callback) {
        if (!_enabled) {
            _reticleMesh.visible = false;
            _circleMesh.visible = false;
            return;
        }

        const referenceSpace = _renderer.xr.getReferenceSpace();

        // Update camera from pose (used from CircleMesh)
        if (_workingMode === this.WORKING_MODE.TARGET) {
            _camera.position.copy(SceneManager.camera.position);
            _camera.quaternion.copy(SceneManager.camera.quaternion);

            _reticleMesh.visible = false;
            _circleMesh.visible = _circleMesh._shouldDisplay;
        }

        // Check for hit source (used from PlaneMesh)
        else if (_workingMode === this.WORKING_MODE.SURFACE) {

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

                    const hit = hitTestResults[0];
                    const pose = hit.getPose(referenceSpace);
                    const rawMatrix = pose.transform.matrix;
                    const threeMatrix = new Matrix4();
                    threeMatrix.fromArray(rawMatrix);
                    let pos = new Vector3();
                    let quat = new Quaternion();
                    let scale = new Vector3();
                    threeMatrix.decompose(pos, quat, scale);
                    _reticleMesh.position.copy(pos);
                    _reticleMesh.quaternion.copy(quat);
                    _reticleMesh.updateMatrix(); ////// NON QUI!!!!!!!!

                    // Check if is the right surface...
                    _surfTypeDetected = _getReticleSurface();
                    if (_surfTypeMode !== this.SURF_TYPE_MODE.ALL) {
                        if (_surfTypeDetected !== _surfTypeMode) {

                            // Not the surface we are looking for!
                            console.log("Not the surface we are looking for!")
                            _isHitting = false;
                            _reticleMesh.visible = false;
                            return false;
                        }
                    }

                    _isHitting = true;

                    if (_surfTypeDetected == 'wall' && !window.iOS) _alignZAxisWithUp();
                    _reticleMesh.visible = _reticleMesh._shouldDisplay;
                    if (callback) callback(_surfTypeDetected);

                } else {
                    _isHitting = false;
                    _reticleMesh.visible = false;
                    _surfTypeDetected = null;
                }
            }
        }
    },

    destroy() {
        // Cleanup della planeMesh e dei suoi children
        if (_reticleMesh) {
            // Rimuovi dalla scena
            if (_scene) {
                _scene.remove(_reticleMesh);
            }

            // Cleanup del _reticleLookAt se presente
            if (_reticleLookAt) {
                _reticleMesh.remove(_reticleLookAt);
                if (_reticleLookAt.geometry) _reticleLookAt.geometry.dispose();
                if (_reticleLookAt.material) _reticleLookAt.material.dispose();
                _reticleLookAt = null;
            }

            // Dispose della geometria e materiale della planeMesh
            if (_reticleMesh.geometry) _reticleMesh.geometry.dispose();
            if (_reticleMesh.material) {
                if (Array.isArray(_reticleMesh.material)) {
                    _reticleMesh.material.forEach(material => material.dispose());
                } else {
                    _reticleMesh.material.dispose();
                }
            }
            _reticleMesh = null;
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
        _surfTypeDetected = null;
        _enabled = true;
        // _reticleMode = null;
        _initialized = false;

        // Reset dei riferimenti
        _renderer = null;
        _scene = null;
        _camera = null;

        _surfTypeMode = this.SURF_TYPE_MODE.ALL;


        console.log("Reticle destroyed successfully");
        console.log("Reticle surfType:", _surfTypeMode)
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
        if (_workingMode === this.WORKING_MODE.SURFACE) return _reticleMesh.matrix;
        if (_workingMode === this.WORKING_MODE.TARGET) return _circleMesh.matrixWorld;
        return null;
    },

    // If NOT visible,
    // the Reticle is not displayed BUT it keep running,
    // so it keep to be updated and detect surfaces
    // DON't confuse with "mesh.visible" internal property
    // that's handled internally
    setVisible(value) {
        if (value) {
            if (_workingMode === this.WORKING_MODE.SURFACE) {
                _reticleMesh._shouldDisplay = true;
                _circleMesh._shouldDisplay = false;
            }
            if (_workingMode === this.WORKING_MODE.TARGET) {
                _reticleMesh._shouldDisplay = false;
                _circleMesh._shouldDisplay = true;
            }
        }
        else {
            _reticleMesh._shouldDisplay = false;
            _circleMesh._shouldDisplay = false;
        }
    },

    visible() {
        if (_reticleMesh._shouldDisplay || _circleMesh._shouldDisplay) return true;
        return false;
    },

    // If NOT enabled,
    // the Reticle is not displayed AND it does not run,
    // so it's NOT updated and doesn't detect surfaces
    setEnabled(value) {
        _enabled = value;
    },

    enabled() {
        return _enabled;
    },

    setSurfType(surfType) {
        _surfTypeMode = surfType;
    },

    setWorkingMode(workingMode) {
        _workingMode = workingMode;
    },

    // backup current setup
    backup() {
        const currentSetup = {
            workingMode: _workingMode,
            surfType: _surfTypeMode,
            meshType: _meshType,
            enabled: _enabled,
            visible: _reticleMesh._shouldDisplay || _circleMesh._shouldDisplay ? true : false
        };
        _backup = currentSetup;
    },

    // restore last setup
    restore() {
        this.setWorkingMode(_backup.workingMode);
        this.setSurfType(_backup.surfType);
        this.setEnabled(_backup.enabled);
        this.setVisible(_backup.visible);
        this.setup(_backup.meshType);
    },

    // Variabili per gestire le chiamate multiple
    // let _reticleStates =[];
    // let _reticleTimeout = null;

    setState(state = {}) {
        // Sistema di gestione di chiamate multiple incoerenti da script diversi...
        const newState = {
            enabled: state.enabled,
            surfType: state.surfType,
            workingMode: state.workingMode,
            visible: state.visible,
            priority: state.priority ?? 0,
            timestamp: Date.now(), // For debug/logging
        };

        _reticleStates.push(newState);

        console.log("|||||||||||||||||||||||||| handleReticleState:", newState);

        const stack = new Error().stack;
        const caller = stack.split("\n")[2]?.trim(); // La seconda linea è il chiamante
        console.log("handleReticleState chiamata da:", caller);

        if (_reticleTimeout) {
            console.warn("ANOTHER CALL TO handleReticleState IN QUEUE!");
            clearTimeout(_reticleTimeout);
        }

        // Wait a little to check if some other state is arriving
        _reticleTimeout = setTimeout(() => {
            try {
                if (_reticleStates.length === 0) {
                    console.warn("handleReticleState: No states to process");
                    return;
                }

                const highestState = _reticleStates.reduce(
                    (max, current) => {
                        return current.priority > max.priority ? current : max;
                    }
                );

                // Just for debugging
                if (_reticleStates.length > 1) {
                    console.log(
                        ` ***************************** Processed ${_reticleStates.length} reticle states, using priority ${highestState.priority}`
                    );
                    console.log("now setting state:", highestState);
                    console.log(
                        "********************************************************************"
                    );
                }

                // Applica le funzioni solo se il valore è definito nello stato
                if (highestState.enabled !== undefined) {
                    setEnabled(highestState.enabled);
                }

                if (highestState.surfType !== undefined) {
                    setSurfType(highestState.surfType);
                }

                if (highestState.workingMode !== undefined) {
                    setWorkingMode(highestState.workingMode);
                }

                if (highestState.visible !== undefined) {
                    setVisible(highestState.visible);
                }

            } catch (error) {
                console.error("Error in handleReticleState:", error);
            } finally {
                // Reset
                _reticleStates.length = 0;
                _reticleTimeout = null;
            }
        }, 200);
    }
}

export default Reticle;   