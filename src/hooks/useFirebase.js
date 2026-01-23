import {
    useAuthState,
    registerUser,
    loginUser,
    logoutUser,
    loginAnonymousUser
} from '../lib/firebase/auth';

import {
    updateLastLogin,
    fetchUserData,
    fetchMarkers,
    addMarker,
    updateMarker,
    updateMarkerViews,
    // updateMarkerLike,
    deleteMarker,
    fetchMarker,
    addGame,
    updateGame,
    deleteGame,
    fetchGames
} from '../lib/firebase/firestore';

import { saveData, loadData, useRealtimeData, deleteData } from '../lib/firebase/realtimeDb';

import {
    uploadFileWithProgress,
    getFileURL,
    deleteFile,
    getFileMetadata,
    listFiles,
    deleteAllFilesInDirectory,
    getFileBlob,
    getFileBlobURL,
    fileExists
} from '../lib/firebase/storage';

export const useFirebase = () => {
    const { user, loading: authLoading } = useAuthState();

    return {
        auth: {
            user,
            authLoading,
            register: async (credentials) => {
                const newUser = await registerUser(credentials);
                return newUser;
            },
            login: async (credentials) => {
                const loggedInUser = await loginUser(credentials);
                await updateLastLogin(loggedInUser.uid);
                return loggedInUser;
            },
            logout: logoutUser,
            loginAnonymous: loginAnonymousUser,
            updateLoginTimestamp: updateLastLogin
        },

        firestore: {
            fetchUserData: () => user() ? fetchUserData(user().uid) : Promise.resolve(null),
            fetchMarkers: (userId) => fetchMarkers(userId),
            fetchMarker: (userId, markerId) => fetchMarker(userId, markerId),
            addMarker: (userId, name) => addMarker(userId, name),
            updateMarker: (userId, markerId, name) => updateMarker(userId, markerId, name),
            updateMarkerViews: (userId, markerId) => updateMarkerViews(userId, markerId),
            // updateMarkerLike: (userId, markerId) => updateMarkerLike(userId, markerId),
            deleteMarker: (userId, markerId) => deleteMarker(userId, markerId),
            addGame: (userId, markerId, name) => addGame(userId, markerId, name),
            updateGame: (userId, markerId, gameId, enabled) => updateGame(userId, markerId, gameId, enabled),
            deleteGame: (userId, markerId, gameId) => deleteGame(userId, markerId, gameId),
            fetchGames: (userId, markerId) => fetchGames(userId, markerId)
        },

        realtimeDb: {
            saveData,
            loadData,
            useRealtimeData,
            deleteData
        },

        storage: {
            uploadFileWithProgress,
            getFileURL,
            deleteFile,
            getFileMetadata,
            listFiles,
            deleteAllFilesInDirectory,
            getFileBlob,
            getFileBlobURL,
            fileExists
        }
    };
};