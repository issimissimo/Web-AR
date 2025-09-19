import { MeshStandardMaterial, MeshPhysicalMaterial } from "three"

export function RecreateMaterials(
    model,
    options = {
        aoMap: null,
        aoMapIntensity: 1,
        lightMap: null,
        lightMapIntensity: 1,
    }
) {
    model.traverse((child) => {
        if (child.isMesh) {
            const mat = new MeshStandardMaterial({
                alphaMap: child.material.alphaMap,
                bumpMap: child.material.bumpMap,
                displacementMap: child.material.displacementMap,
                emissive: child.material.emissive,
                emissiveMap: child.material.emissiveMap,
                map: child.material.map,
                name: child.material.name,
                normalMap: child.material.normalMap,
                opacity: child.material.opacity,
                roughnessMap: child.material.roughnessMap,
                transparent: child.material.transparent,
                metalnessMap: child.material.metalnessMap,

                aoMap: options.aoMap,
                aoMapIntensity: options.aoMapIntensity,
                color: child.material.color,
                metalness: child.material.metalness,
                roughness: child.material.roughness,
            })
            child.material = mat
            child.material.needsUpdate = true
        }
    })
    return model
}

export function setMaterialsShadows(model, value) {
    model.traverse((child) => {
        child.castShadow = value
    })
}
