import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

import {
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import { auth, firestore, anonymousLogin } from "./init";
import { createSignal, onCleanup } from "solid-js";


export const registerUser = async (credentials) => {
    console.log("registerUser:", credentials)
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
        );

        // Salva i dati del nuovo utente in Firestore
        await saveNewUserData(userCredential.user);

        return userCredential.user;
    } catch (error) {
        throw new Error(`Registration failed: ${error.message}`);
    }
};

export const loginUser = async (credentials) => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
        );
        return userCredential.user;
    } catch (error) {
        throw new Error(`Login failed: ${error.message}`);
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        throw new Error(`Logout failed: ${error.message}`);
    }
};

export const loginAnonymousUser = async () => {
    try {
        return await anonymousLogin();
    } catch (error) {
        throw new Error(`Anonymous login failed: ${error.message}`);
    }
};

export const useAuthState = () => {
    const [user, setUser] = createSignal(null);
    const [loading, setLoading] = createSignal(true);

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
        setUser(authUser);
        setLoading(false);
    });

    onCleanup(() => unsubscribe());

    return { user, loading };
};

export const saveNewUserData = async (user) => {
    const userRef = doc(firestore, "users", user.uid);

    await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        created: serverTimestamp(),
        lastLogin: serverTimestamp()
    }, { merge: true });
};