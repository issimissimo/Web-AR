import { MeshStandardMaterial, MeshPhysicalMaterial } from 'three';

export function RecreateMaterials(model, options = {
    aoMap: null,
    aoMapIntensity: 1,
    lightMap: null,
    lightMapIntensity: 1
}) {
    model.traverse((child) => {
        if (child.isMesh) {

            const mat = new MeshStandardMaterial({
                aoMap: options.aoMap,
                aoMapIntensity: options.aoMapIntensity,
                color: child.material.color,
                metalness: child.material.metalness,
                roughness: child.material.roughness
            });
            child.material = mat;
            child.material.needsUpdate = true;
        }
    });
    return model;
}

export function setMaterialsShadows(model, value) {
    model.traverse((child) => {
        child.castShadow = value;
    });
}