// internetCheck.js

/**
 * Verifica se c'è connessione a Internet
 * @returns {Promise<boolean>} true se c'è connessione, false altrimenti
 */
export async function checkInternetConnection() {
    // Controlla prima lo stato del navigator
    if (!navigator.onLine) {
        return false;
    }

    try {
        // Prova a fare una richiesta HEAD a un endpoint affidabile
        const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Monitora i cambiamenti dello stato della connessione
 * @param {Function} callback - Funzione chiamata quando lo stato cambia
 * @returns {Function} Funzione per rimuovere i listener
 */
export function onConnectionChange(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ritorna una funzione per pulire i listener
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}

/**
 * Controlla periodicamente la connessione
 * @param {Function} callback - Funzione chiamata ad ogni check
 * @param {number} interval - Intervallo in millisecondi (default: 30000)
 * @returns {Function} Funzione per fermare il controllo periodico
 */
export function startConnectionMonitor(callback, interval = 30000) {
    let timeoutId;

    const check = async () => {
        const isOnline = await checkInternetConnection();
        callback(isOnline);
        timeoutId = setTimeout(check, interval);
    };

    check();

    return () => clearTimeout(timeoutId);
}
