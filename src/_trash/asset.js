import * as THREE from 'three';
import { getOffsetMatrix, getGlobalMatrixFromOffsetMatrix } from "../tools/three/maths.js";


export class Asset {
    constructor(type, glbFileName, options = {}) {
        this.id = options.id || this.generateId();
        this.type = type;
        this.glbFileName = glbFileName;

        // Inizializza la matrice come identità se non fornita
        this.matrix = options.matrix || new THREE.Matrix4();

        // Proprietà aggiuntive opzionali
        this.name = options.name || `${type}_${this.id}`;
        this.userData = options.userData || {};

        // Riferimento all'oggetto Three.js caricato (non serializzato)
        this.mesh = null;
        this.isLoaded = false;
    }

    // Genera un ID univoco semplice
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Metodi per manipolare la trasformazione
    setPosition(x, y, z) {
        const position = new THREE.Vector3(x, y, z);
        this.matrix.setPosition(position);
        if (this.mesh) {
            this.mesh.matrix.copy(this.matrix);
        }
        return this;
    }

    setRotation(x, y, z) {
        const euler = new THREE.Euler(x, y, z);

        const position = new THREE.Vector3();
        const scale = new THREE.Vector3();
        this.matrix.decompose(position, new THREE.Quaternion(), scale);

        this.matrix.compose(position, new THREE.Quaternion().setFromEuler(euler), scale);

        if (this.mesh) {
            this.mesh.matrix.copy(this.matrix);
        }
        return this;
    }

    setScale(x, y, z) {
        const scale = new THREE.Vector3(x, y || x, z || x);
        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();

        this.matrix.decompose(position, rotation, new THREE.Vector3());
        this.matrix.compose(position, rotation, scale);

        if (this.mesh) {
            this.mesh.matrix.copy(this.matrix);
        }
        return this;
    }

    // Applica la matrice al mesh Three.js
    applyMatrixToMesh() {
        if (this.mesh) {
            this.mesh.matrixAutoUpdate = false;
            this.mesh.matrix.copy(this.matrix);
        }
    }

    // Serializzazione per JSON/Database
    toJSON(referenceMatrix) {
        const offsetMatrix = getOffsetMatrix(referenceMatrix, this.matrix);
        return {
            id: this.id,
            type: this.type,
            glbFileName: this.glbFileName,
            name: this.name,
            offsetMatrix: offsetMatrix.elements, // Array di 16 numeri
            userData: this.userData
        };
    }

    // Deserializzazione da JSON
    static fromJSON(data, referenceMatrix) {
        const offsetMatrix = new THREE.Matrix4();
        offsetMatrix.fromArray(data.offsetMatrix);

        const globalMatrix = getGlobalMatrixFromOffsetMatrix(referenceMatrix, offsetMatrix);

        return new Asset(data.type, data.glbFileName, {
            id: data.id,
            name: data.name,
            matrix: globalMatrix,
            userData: data.userData || {}
        });
    }

    // Clona l'asset
    clone() {
        return Asset.fromJSON(this.toJSON());
    }
}