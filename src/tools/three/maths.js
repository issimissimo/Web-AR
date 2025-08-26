// export function getOffsetMatrix(matrixA, matrixB) {
//     const m = matrixA.clone().invert().multiply(matrixB);
//     return m;
// }
export function getObjOffsetMatrix(refMatrix, obj) {
    obj.updateWorldMatrix(true, false);
    const matrixB = obj.matrix;
    const m = refMatrix.clone().invert().multiply(matrixB);
    return m;
}
export function getGlobalMatrixFromOffsetMatrix(matrixA, matrixB) {
    const m = matrixA.clone().multiply(matrixB);
    return m;
}
export function getDistanceBetweenPoints(pointA, pointB) {
    return pointA.distanceTo(pointB);
}
export function getDistanceBetweenVectors(vectorA, vectorB) {
    return vectorA.distanceTo(vectorB);
}
export function getDistanceBetweenMatrices(matrixA, matrixB) {
    const positionA = new THREE.Vector3().setFromMatrixPosition(matrixA);
    const positionB = new THREE.Vector3().setFromMatrixPosition(matrixB);
    return getDistanceBetweenPoints(positionA, positionB);
}
export function getDistanceBetweenMatrices2(matrixA, matrixB) {
    const positionA = new THREE.Vector3().setFromMatrixPosition(matrixA);
    const positionB = new THREE.Vector3().setFromMatrixPosition(matrixB);
    return getDistanceBetweenVectors(positionA, positionB);
}
export function getDistanceBetweenMatrices3(matrixA, matrixB) {
    const positionA = new THREE.Vector3().setFromMatrixPosition(matrixA);
    const positionB = new THREE.Vector3().setFromMatrixPosition(matrixB);
    return getDistanceBetweenVectors(positionA, positionB);
}
export function getDistanceBetweenMatrices4(matrixA, matrixB) {
    const positionA = new THREE.Vector3().setFromMatrixPosition(matrixA);
    const positionB = new THREE.Vector3().setFromMatrixPosition(matrixB);
    return getDistanceBetweenVectors(positionA, positionB);
}
