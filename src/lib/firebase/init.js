import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// import { firebaseConfig } from "@js/env";
import { firebaseConfig } from "@root/CREDENTIALS.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

export const anonymousLogin = async () => {
    try {
        console.log("init - anonymousLogin")
        const userCredential = await signInAnonymously(auth);
        console.log("init - LOGGED!")
        return userCredential.user;
    } catch (error) {
        throw new Error(`Anonymous login failed: ${error.message}`);
    }
};