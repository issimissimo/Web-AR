const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Funzione ricorsiva per eliminare una collezione
 * e tutte le sue sottocollezioni
 */
async function deleteCollectionRecursive(collectionRef, batchSize = 100) {
    const query = collectionRef.limit(batchSize);
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        return;
    }

    const db = admin.firestore();
    const batch = db.batch();

    for (const doc of snapshot.docs) {
        const subCollections = await doc.ref.listCollections();
        for (const subColl of subCollections) {
            await deleteCollectionRecursive(subColl, batchSize);
        }
        batch.delete(doc.ref);
    }

    await batch.commit();

    if (snapshot.size >= batchSize) {
        await deleteCollectionRecursive(collectionRef, batchSize);
    }
}

/**
 * Cloud Function che elimina automaticamente tutte le collezioni
 * e sottocollezioni quando viene eliminato un marker
 */
exports.cascadeDeleteMarker = functions.firestore
    .document("users/{userId}/markers/{markerId}")
    .onDelete(async (snap, context) => {
        const docRef = snap.ref;
        const {userId, markerId} = context.params;

        console.log("Inizio eliminazione a cascata per marker:", markerId);

        try {
            const collections = await docRef.listCollections();

            if (collections.length === 0) {
                console.log("Nessuna sottocollezione da eliminare");
                return null;
            }

            console.log("Trovate", collections.length, "collezioni da eliminare");

            for (const collection of collections) {
                console.log("Eliminazione collezione:", collection.id);
                await deleteCollectionRecursive(collection);
            }

            console.log("Eliminazione completata con successo");
            return null;
        } catch (error) {
            console.error("Errore durante eliminazione a cascata:", error);
            throw error;
        }
    });