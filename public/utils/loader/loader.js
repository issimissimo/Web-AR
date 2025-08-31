// File: public/utils/loader/loader.js
class Loader {
  constructor(containerId = 'loaderContainer') {
    this.containerId = containerId;
    this.isVisible = false;
    this.container = null;
    
    // Inizializza immediatamente il loader
    this.init();
  }

  init() {
    console.log("******* Loader --- INIT")
    // Se il document è già pronto, crea subito il loader
    if (document.readyState !== 'loading') {
      this.createLoader();
      this.show(0);
    } else {
      // Altrimenti aspetta che il DOM sia pronto
      document.addEventListener('DOMContentLoaded', () => {
        this.createLoader();
        this.show(0);
      });
    }
  }

  createLoader() {
    // Controlla se il loader esiste già
    if (document.getElementById(this.containerId)) {
      this.container = document.getElementById(this.containerId);
      return;
    }
    
    // Crea il container del loader
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    
    // Crea il container interno per gli elementi del loader
    const loaderInnerContainer = document.createElement('div');
    loaderInnerContainer.className = 'loader-container';
    
    // Crea gli elementi del loader
    const loader1 = document.createElement('span');
    loader1.className = 'loader';
    
    const loader2 = document.createElement('span');
    loader2.className = 'loader2';
    
    const loaderText = document.createElement('div');
    loaderText.className = 'loader-text';
    loaderText.textContent = 'Caricamento...';
    
    // Aggiungi gli elementi al container interno
    loaderInnerContainer.appendChild(loader1);
    loaderInnerContainer.appendChild(loader2);
    
    // Aggiungi il container interno e il testo al container principale
    this.container.appendChild(loaderInnerContainer);
    this.container.appendChild(loaderText);
    
    // Aggiungi il container al body (come primo elemento)
    document.body.insertBefore(this.container, document.body.firstChild);
  }

  show(delay = 0) {
    if (!this.container) {
      setTimeout(() => this.show(delay), 100);
      return;
    }
    
    setTimeout(() => {
      this.container.classList.add('fade-in');
      this.container.classList.remove('fade-out');
      this.isVisible = true;
    }, delay);
  }

  hide(delay = 0) {
    if (!this.container) {
      setTimeout(() => this.hide(delay), 100);
      return;
    }
    
    setTimeout(() => {
      this.container.classList.add('fade-out');
      this.container.classList.remove('fade-in');
      this.isVisible = false;
    }, delay);
  }

  toggle(delay = 0) {
    if (this.isVisible) {
      this.hide(delay);
    } else {
      this.show(delay);
    }
  }
}

// Crea un'istanza globale immediatamente
window.Loader = new Loader();