// imageLoader.js

class SmartImageLoader {
  constructor() {
    this.pendingImages = new Set();
    this.loadedImages = new Map();
    this.listeners = new Set();
  }

  /**
   * Carica una o più immagini
   * @param {string|string[]} urls - URL singolo o array di URLs
   * @returns {Promise<void>} - Promise che si risolve quando tutte le immagini sono caricate
   */
  async load(urls) {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    const promises = urlArray.map(url => {
      // Se l'immagine è già caricata, ritorna subito
      if (this.loadedImages.has(url)) {
        return Promise.resolve(this.loadedImages.get(url));
      }

      // Se è già in caricamento, aspetta
      if (this.pendingImages.has(url)) {
        return this._waitForImage(url);
      }

      return this._loadImage(url);
    });

    await Promise.all(promises);
    this._checkAllLoaded();
  }

  /**
   * Carica una singola immagine
   */
  _loadImage(url) {
    this.pendingImages.add(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.pendingImages.delete(url);
        this.loadedImages.set(url, img);
        resolve(img);
      };

      img.onerror = () => {
        this.pendingImages.delete(url);
        console.error(`Failed to load image: ${url}`);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Aspetta che un'immagine già in caricamento sia pronta
   */
  _waitForImage(url) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.loadedImages.has(url)) {
          clearInterval(checkInterval);
          resolve(this.loadedImages.get(url));
        }
        if (!this.pendingImages.has(url) && !this.loadedImages.has(url)) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);
    });
  }

  /**
   * Controlla se tutte le immagini sono state caricate
   */
  _checkAllLoaded() {
    if (this.pendingImages.size === 0) {
      this._notifyListeners(true);
    }
  }

  /**
   * Notifica tutti i listeners
   */
  _notifyListeners(allLoaded) {
    this.listeners.forEach(callback => callback(allLoaded));
  }

  /**
   * Registra un callback da chiamare quando tutte le immagini sono caricate
   * @param {Function} callback - Funzione da chiamare con parametro boolean
   * @returns {Function} - Funzione per rimuovere il listener
   */
  onAllLoaded(callback) {
    this.listeners.add(callback);
    
    // Se non ci sono immagini in caricamento, notifica subito
    if (this.pendingImages.size === 0) {
      callback(true);
    }

    // Ritorna funzione per rimuovere il listener
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Ottiene lo stato corrente
   */
  getStatus() {
    return {
      pending: this.pendingImages.size,
      loaded: this.loadedImages.size,
      allLoaded: this.pendingImages.size === 0
    };
  }

  /**
   * Reset del loader
   */
  reset() {
    this.pendingImages.clear();
    this.loadedImages.clear();
    this.listeners.clear();
  }

  /**
   * Precarica immagini senza attendere
   */
  preload(urls) {
    this.load(urls).catch(err => {
      console.error('Preload error:', err);
    });
  }
}

// Esporta istanza singleton
export const smartImageLoader = new SmartImageLoader();

// Esporta anche la classe per creare istanze separate se necessario
export default SmartImageLoader;