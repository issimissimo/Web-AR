import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata,
    getBlob
} from "firebase/storage";
import { storage } from "./init";

/**
 * Carica un file su Firebase Storage
 * @param {string} path - Percorso dove salvare il file (es: 'users/userId/files/filename.jpg')
 * @param {File|Blob} file - File da caricare
 * @param {Object} metadata - Metadata opzionali (contentType, customMetadata, etc.)
 * @returns {Promise<string>} URL di download del file
 */
export const uploadFile = async (path, file, metadata = {}) => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("File caricato con successo:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Errore nel caricamento del file:", error);
        throw new Error(`Upload failed: ${error.message}`);
    }
};

/**
 * Carica un file con monitoraggio del progresso
 * @param {string} path - Percorso dove salvare il file
 * @param {File|Blob} file - File da caricare
 * @param {Function} onProgress - Callback per il progresso (riceve percentuale 0-100)
 * @param {Object} metadata - Metadata opzionali
 * @returns {Promise<string>} URL di download del file
 */
export const uploadFileWithProgress = (path, file, onProgress = null, metadata = {}) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload progress: ${progress}%`);
                if (onProgress) {
                    onProgress(progress);
                }
            },
            (error) => {
                console.error("Errore durante l'upload:", error);
                reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log("File caricato con successo:", downloadURL);
                    resolve(downloadURL);
                } catch (error) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                }
            }
        );
    });
};

/**
 * Scarica l'URL di un file già caricato
 * @param {string} path - Percorso del file nello storage
 * @returns {Promise<string>} URL di download
 */
export const getFileURL = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error("Errore nel recupero URL del file:", error);
        throw new Error(`Failed to get file URL: ${error.message}`);
    }
};

/**
 * Elimina un file dallo storage
 * @param {string} path - Percorso del file da eliminare
 * @returns {Promise<boolean>}
 */
export const deleteFile = async (path) => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log(`File ${path} eliminato con successo`);
        return true;
    } catch (error) {
        console.error(`Errore nell'eliminazione del file ${path}:`, error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};

/**
 * Ottiene i metadata di un file
 * @param {string} path - Percorso del file
 * @returns {Promise<Object>} Metadata del file
 */
export const getFileMetadata = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const metadata = await getMetadata(storageRef);
        return {
            name: metadata.name,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            fullPath: metadata.fullPath,
            customMetadata: metadata.customMetadata || {}
        };
    } catch (error) {
        throw new Error(`Failed to get metadata: ${error.message}`);
    }
};

/**
 * Lista tutti i file in una directory
 * @param {string} path - Percorso della directory
 * @returns {Promise<Array>} Array di oggetti con info sui file
 */
export const listFiles = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        
        const files = await Promise.all(
            result.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                const metadata = await getMetadata(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url: url,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    timeCreated: metadata.timeCreated
                };
            })
        );

        return files;
    } catch (error) {
        console.error("Errore nel listare i file:", error);
        throw new Error(`Failed to list files: ${error.message}`);
    }
};

/**
 * Elimina tutti i file in una directory
 * @param {string} path - Percorso della directory
 * @returns {Promise<number>} Numero di file eliminati
 */
export const deleteAllFilesInDirectory = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        
        await Promise.all(
            result.items.map(itemRef => deleteObject(itemRef))
        );

        console.log(`Eliminati ${result.items.length} file dalla directory ${path}`);
        return result.items.length;
    } catch (error) {
        console.error("Errore nell'eliminazione dei file:", error);
        throw new Error(`Failed to delete files: ${error.message}`);
    }
};

/**
 * Scarica un file come Blob (utile per evitare problemi CORS con Three.js, ecc.)
 * @param {string} path - Percorso del file nello storage
 * @returns {Promise<Blob>} Blob del file
 */
export const getFileBlob = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const blob = await getBlob(storageRef);
        console.log(`Blob scaricato per ${path}:`, blob);
        return blob;
    } catch (error) {
        console.error("Errore nel download del blob:", error);
        throw new Error(`Failed to get file blob: ${error.message}`);
    }
};

/**
 * Scarica un file come Blob e crea un Blob URL locale
 * @param {string} path - Percorso del file nello storage
 * @returns {Promise<string>} Blob URL (ricordati di chiamare URL.revokeObjectURL quando hai finito!)
 */
export const getFileBlobURL = async (path) => {
    try {
        const blob = await getFileBlob(path);
        const blobUrl = URL.createObjectURL(blob);
        console.log(`Blob URL creato per ${path}:`, blobUrl);
        return blobUrl;
    } catch (error) {
        console.error("Errore nella creazione del Blob URL:", error);
        throw new Error(`Failed to create blob URL: ${error.message}`);
    }
};