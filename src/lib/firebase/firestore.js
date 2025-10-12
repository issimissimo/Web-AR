import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    increment
} from "firebase/firestore";
import { firestore } from "./init";

/**
 * Aggiorna il timestamp dell'ultimo accesso per un utente
 * @param {string} userId - ID dell'utente
 */
export const updateLastLogin = async (userId) => {
    try {
        const userRef = doc(firestore, "users", userId);
        await setDoc(userRef, {
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Errore nell'aggiornamento ultimo accesso:", error);
        throw error;
    }
};

/**
 * Carica i dati utente da Firestore
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object|null>} Dati utente o null se non trovato
 */
export const fetchUserData = async (userId) => {
    try {
        const userRef = doc(firestore, "users", userId);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            return {
                id: data.id,
                email: data.email,
                lastLogin: data.lastLogin?.toDate(), // Converti Firestore Timestamp a Date
                created: data.created?.toDate()      // Converti Firestore Timestamp a Date
            };
        }
        return null;
    } catch (error) {
        console.error("Errore nel caricamento dati utente:", error);
        throw error;
    }
};

/**
 * Salva i dati per un nuovo utente
 * @param {Object} user - Oggetto utente di Firebase
 */
export const saveNewUserData = async (user) => {
    console.log("saveNewUserData:", user)
    try {
        const userRef = doc(firestore, "users", user.uid);

        await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            created: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        console.log("Dati nuovo utente salvati per:", user.email);
    } catch (error) {
        console.error("Errore nel salvataggio nuovo utente:", error);
        throw error;
    }
};

export const fetchMarkers = async (userId) => {
    try {
        const markersRef = collection(firestore, `users/${userId}/markers`);
        const snapshot = await getDocs(markersRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Errore nel caricamento dei markers:", error);
        throw error;
    }
};


export const fetchMarker = async (userId, markerId) => {
    try {
        const markerRef = doc(firestore, `users/${userId}/markers/${markerId}`);
        const snapshot = await getDoc(markerRef);
        return snapshot.data();
    } catch (error) {
        console.error("Errore nel caricamento del marker:", error);
        throw error;
    }
};


export const addMarker = async (userId, name, coverTitle) => {
    try {
        const markersRef = collection(firestore, `users/${userId}/markers`);
        const newMarkerRef = await addDoc(markersRef,
            {
                name,
                created: serverTimestamp(),
                views: 0,
                like: 0,
                coverTitle: coverTitle,
            });
        return newMarkerRef.id;
    } catch (error) {
        console.error("Errore nell'aggiunta marker:", error);
        throw error;
    }
};

export const updateMarker = async (userId, markerId, name) => {
    try {
        const markerRef = doc(firestore, `users/${userId}/markers/${markerId}`);
        await updateDoc(markerRef,
            {
                name,
            });
    } catch (error) {
        console.error("Errore nell'aggiornamento marker:", error);
        throw error;
    }
};

export const updateMarkerViews = async (userId, markerId) => {
    try {
        const markerRef = doc(firestore, `users/${userId}/markers/${markerId}`);
        await updateDoc(markerRef, {
            views: increment(1)
        });
        console.log("Views incrementate con successo");
    } catch (error) {
        console.error("Errore nell'incremento views:", error);
        throw error;
    }
};

export const updateMarkerLike = async (userId, markerId) => {
    try {
        const markerRef = doc(firestore, `users/${userId}/markers/${markerId}`);
        await updateDoc(markerRef, {
            like: increment(1)
        });
    } catch (error) {
        console.error("Errore nell'incremento like:", error);
        throw error;
    }
};

export const deleteMarker = async (userId, markerId) => {
    try {
        const markerRef = doc(firestore, `users/${userId}/markers/${markerId}`);
        await deleteDoc(markerRef);
    } catch (error) {
        console.error("Errore nella cancellazione marker:", error);
        throw error;
    }
};

export const addGame = async (userId, markerId, name) => {
    try {
        const gameRef = collection(firestore, `users/${userId}/markers/${markerId}/games`);
        const newGameRef = await addDoc(gameRef,
            {
                name,
                enabled: true,
                created: serverTimestamp(),
            });
        return newGameRef.id;
    } catch (error) {
        console.error("Errore nell'aggiunta game:", error);
        throw error;
    }
};

export const updateGame = async (userId, markerId, gameId, enabled) => {
    try {
        const gameRef = doc(firestore, `users/${userId}/markers/${markerId}/games/${gameId}`);
        await updateDoc(gameRef,
            {
                enabled: enabled,
            });
    } catch (error) {
        console.error("Errore nella modifica del game:", error);
        throw error;
    }
};

export const deleteGame = async (userId, markerId, gameId) => {
    try {
        const gameRef = doc(firestore, `users/${userId}/markers/${markerId}/games/${gameId}`);
        await deleteDoc(gameRef);
    } catch (error) {
        console.error("Errore nella cancellazione game:", error);
        throw error;
    }
};

export const fetchGames = async (userId, markerId) => {
    try {
        const gameRef = collection(firestore, `users/${userId}/markers/${markerId}/games`);
        const snapshot = await getDocs(gameRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Errore nel caricamento dei games:", error);
        throw error;
    }
};