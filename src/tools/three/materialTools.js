import { MeshStandardMaterial, MeshPhysicalMaterial } from "three"

export function RecreateMaterials(
    model,
    options = {
        aoMap: null,
        aoMapIntensity: 1,
        aoMapChannel: 0,
        lightMap: null,
        lightMapIntensity: 1,
        lightMapChannel: 0
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

                aoMap: options.aoMap || null,
                aoMapIntensity: options.aoMapIntensity || 1,
                lightMap: options.lightMap || null,
                lightMapIntensity: options.lightMapIntensity || 1,
                color: child.material.color,
                metalness: child.material.metalness,
                roughness: child.material.roughness,
            })
            child.material = mat;
            if (child.material.aoMap) {
                child.material.aoMap.channel = options.aoMapChannel || 0;
            }
            if (child.material.lightMap) {
                child.material.lightMap.channel = options.lightMapChannel || 0;
            }
            child.material.needsUpdate = true
        }
    })
    return model
}

export function RecreateMaterialsExtended(
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
            // Proprietà comuni a entrambi i materiali
            const commonProps = {
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
                lightMap: options.lightMap,
                lightMapIntensity: options.lightMapIntensity,
                color: child.material.color,
                metalness: child.material.metalness,
                roughness: child.material.roughness,
            }

            let newMaterial;

            // Controlla se il materiale originale è MeshPhysicalMaterial
            if (child.material.isMeshPhysicalMaterial) {
                newMaterial = new MeshPhysicalMaterial({
                    ...commonProps,
                    // Proprietà specifiche di MeshPhysicalMaterial
                    clearcoat: child.material.clearcoat,
                    clearcoatMap: child.material.clearcoatMap,
                    clearcoatNormalMap: child.material.clearcoatNormalMap,
                    clearcoatNormalScale: child.material.clearcoatNormalScale,
                    clearcoatRoughness: child.material.clearcoatRoughness,
                    clearcoatRoughnessMap: child.material.clearcoatRoughnessMap,
                    ior: child.material.ior,
                    reflectivity: child.material.reflectivity,
                    sheen: child.material.sheen,
                    sheenColor: child.material.sheenColor,
                    sheenColorMap: child.material.sheenColorMap,
                    sheenRoughness: child.material.sheenRoughness,
                    sheenRoughnessMap: child.material.sheenRoughnessMap,
                    transmission: child.material.transmission,
                    transmissionMap: child.material.transmissionMap,
                    thickness: child.material.thickness,
                    thicknessMap: child.material.thicknessMap,
                    attenuationDistance: child.material.attenuationDistance,
                    attenuationColor: child.material.attenuationColor,
                    specularIntensity: child.material.specularIntensity,
                    specularIntensityMap: child.material.specularIntensityMap,
                    specularColor: child.material.specularColor,
                    specularColorMap: child.material.specularColorMap,
                })
            } else {
                // Default a MeshStandardMaterial
                newMaterial = new MeshStandardMaterial(commonProps)
            }

            child.material = newMaterial
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

export function findMaterialByName(object, materialName) {
    // Controlla se l'oggetto corrente ha un materiale
    if (object.material) {
        // Se è un singolo materiale
        if (object.material.name === materialName) {
            return object.material;
        }

        // Se è un array di materiali (per geometrie multi-materiale)
        if (Array.isArray(object.material)) {
            for (let material of object.material) {
                if (material.name === materialName) {
                    return material;
                }
            }
        }
    }

    // Ricerca ricorsiva nei children
    for (let child of object.children) {
        const foundMaterial = findMaterialByName(child, materialName);
        if (foundMaterial) {
            return foundMaterial;
        }
    }

    // Non trovato
    return null;
}
