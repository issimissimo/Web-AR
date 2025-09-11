import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ARButton } from "./ARButton";
import {
    Scene,
    PerspectiveCamera,
    HemisphereLight,
    WebGLRenderer,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    AudioListener
} from 'three';


const SceneManager = {
    _initialized: false,

    init() {
        if (this._initialized) {
            console.warn("Scene is already initialized");
            return;
        }

        // Inizializzazione scena ThreeJS
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        this.light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
        this.light.position.set(0.5, 1, 0.25);
        this.scene.add(this.light);

        // Inizializzazione renderer
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;

        // Creazione container DOM
        this.container = document.createElement("div");
        document.body.appendChild(this.container);
        this.container.appendChild(this.renderer.domElement);

        // Inizializzazione controller XR
        this.controller = this.renderer.xr.getController(0);
        this.scene.add(this.controller);

        // Event listener per resize (manteniamo riferimento per cleanup)
        this.resizeHandler = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", this.resizeHandler);

        // Audio
        this.listener = new AudioListener();
        this.camera.add(this.listener);

        // Creazione AR Button
        this.arButton = ARButton.createButton(this.renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.getElementById("ar-overlay") },
        })
        document.getElementById("ArButtonContainer").appendChild(this.arButton);

        console.log("SceneManager initialized");
        this._initialized = true;
    },

    destroy() {
        if (!this._initialized) {
            console.warn("Scene not initialized, nothing to destroy");
            return;
        }

        // 1. Termina sessione XR se attiva
        if (this.renderer.xr.isPresenting) {
            this.renderer.xr.getSession().end();
        }

        // 2. Rimuovi event listeners
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = null;
        }

        // 3. Pulizia scena ThreeJS
        if (this.scene) {
            // Rimuovi tutti gli oggetti dalla scena
            while (this.scene.children.length > 0) {
                const child = this.scene.children[0];
                this.scene.remove(child);

                // Dispose delle geometrie e materiali se presenti
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        }

        // 4. Dispose del renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // 5. Rimuovi elementi DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        if (this.arButton && this.arButton.parentNode) {
            this.arButton.parentNode.removeChild(this.arButton);
        }

        // 6. Reset delle proprietà
        this.scene = null;
        this.camera = null;
        this.light = null;
        this.renderer = null;
        this.container = null;
        this.controller = null;
        this.arButton = null;
        this.listener = null;
        this._initialized = false;

        console.log("SceneManager destroyed");
    },


    async loadGizmo() {
        this.gizmo = await this.loadGltf("models/gizmo.glb");
    },

    _updateDefaultCamera() {
        const xrCamera = this.renderer.xr.getCamera();
        // console.log("XR:", xrCamera.position, xrCamera.quaternion);
        this.camera.position.copy(xrCamera.position);
        this.camera.quaternion.copy(xrCamera.quaternion);
        // console.log("STD:", this.camera.position, this.camera.quaternion);
    },

    update() {
        if (!this._initialized) {
            console.error("SceneManager not initialized");
            return;
        }
        if (this.renderer.xr.isPresenting) {
            this._updateDefaultCamera();
        }
        this.renderer.render(this.scene, this.camera);
    },

    initialized() {
        return this._initialized;
    },

    // Add a mesh to the scene
    // mesh: Mesh, matrix: Matrix4, name: string, matrixAutoUpdate: boolean, visible: boolean,  
    addGltfToScene(gltf, matrix, name = "", childrenNumber = 0, matrixAutoUpdate = true, visible = true) {
        const ref = gltf.children[childrenNumber];
        const mesh = ref.clone();
        matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
        mesh.matrixAutoUpdate = matrixAutoUpdate;
        mesh.visible = visible;
        mesh.name = name;
        this.scene.add(mesh);
        return mesh;
    },

    addTestCube(matrix, size = 0.2, name = "testCube") {
        const geometry = new BoxGeometry(size, size, size);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new Mesh(geometry, material);
        matrix.decompose(cube.position, cube.quaternion, cube.scale);
        cube.name = name;
        this.scene.add(cube);
    },

    loadGltf(fileName) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                fileName,
                (gltf) => {
                    resolve(gltf.scene);
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                (error) => {
                    console.error('An error happened', error);
                    reject(error);
                }
            );
        });
    },
}

export default SceneManager;