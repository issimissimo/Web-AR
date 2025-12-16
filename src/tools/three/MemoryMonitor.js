class MemoryMonitor {
  constructor(thresholdPercent = 90, checkInterval = 1000) {
    this.thresholdPercent = thresholdPercent;
    this.checkInterval = checkInterval;
    this.lastCheckTime = 0;
    this.isHighMemory = false;
    this.eventTarget = new EventTarget();
    this.isSupported = this.checkSupport();
    
    if (!this.isSupported) {
      console.warn('Performance.memory API non supportata in questo browser');
    }
  }

  // Verifica se il browser supporta l'API memory
  checkSupport() {
    return 'memory' in performance;
  }

  // Chiamare questo metodo nel loop di render o in un interval
  update(currentTime = performance.now()) {
    if (!this.isSupported) return null;

    // Controlla solo a intervalli regolari (non ad ogni frame)
    if (currentTime - this.lastCheckTime < this.checkInterval) {
      return this.getMemoryStats();
    }

    this.lastCheckTime = currentTime;
    const stats = this.getMemoryStats();
    
    if (!stats) return null;

    const usagePercent = (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100;

    // Trigger eventi
    if (usagePercent >= this.thresholdPercent && !this.isHighMemory) {
      this.isHighMemory = true;
      this.triggerHighMemoryEvent(stats, usagePercent);
    } else if (usagePercent < this.thresholdPercent - 10 && this.isHighMemory) {
      // Isteresi di 10% per evitare flapping
      this.isHighMemory = false;
      this.triggerNormalMemoryEvent(stats, usagePercent);
    }

    return stats;
  }

  // Ottieni statistiche memoria correnti
  getMemoryStats() {
    if (!this.isSupported) return null;

    const mem = performance.memory;
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      usedMB: (mem.usedJSHeapSize / 1048576).toFixed(2),
      totalMB: (mem.totalJSHeapSize / 1048576).toFixed(2),
      limitMB: (mem.jsHeapSizeLimit / 1048576).toFixed(2),
      usagePercent: ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(2)
    };
  }

  // Trigger evento quando la memoria supera la soglia
  triggerHighMemoryEvent(stats, usagePercent) {
    const event = new CustomEvent('highmemory', {
      detail: { 
        stats, 
        usagePercent: usagePercent.toFixed(2),
        threshold: this.thresholdPercent 
      }
    });
    this.eventTarget.dispatchEvent(event);
  }

  // Trigger evento quando la memoria torna normale
  triggerNormalMemoryEvent(stats, usagePercent) {
    const event = new CustomEvent('normalmemory', {
      detail: { 
        stats, 
        usagePercent: usagePercent.toFixed(2),
        threshold: this.thresholdPercent 
      }
    });
    this.eventTarget.dispatchEvent(event);
  }

  // Forza il garbage collection (solo in Chrome con flag --expose-gc)
  forceGC() {
    if (window.gc) {
      window.gc();
      console.log('Garbage collection forzata');
    } else {
      console.warn('GC non disponibile. Avvia Chrome con --js-flags="--expose-gc"');
    }
  }

  // Metodo per ascoltare gli eventi
  on(eventName, callback) {
    this.eventTarget.addEventListener(eventName, callback);
  }

  // Metodo per rimuovere listener
  off(eventName, callback) {
    this.eventTarget.removeEventListener(eventName, callback);
  }
}

// Esempio di utilizzo:
/*
import * as THREE from 'three';
import FPSMonitor from './FPSMonitor';
import MemoryMonitor from './MemoryMonitor';

const fpsMonitor = new FPSMonitor(15);
const memoryMonitor = new MemoryMonitor(90, 2000); // 90% soglia, check ogni 2 secondi

// Ascolta eventi di memoria alta
memoryMonitor.on('highmemory', (e) => {
  console.error(`⚠️ Memoria critica! Uso: ${e.detail.stats.usedMB}MB / ${e.detail.stats.limitMB}MB (${e.detail.usagePercent}%)`);
  
  // Azioni di emergenza:
  // - Riduci texture resolution
  // - Rimuovi oggetti non visibili
  // - Disabilita effetti post-processing
  // - Libera risorse non utilizzate
  
  // Esempio: dispose di geometrie/materiali non usati
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
  
  // Forza GC se disponibile
  memoryMonitor.forceGC();
});

memoryMonitor.on('normalmemory', (e) => {
  console.log(`✓ Memoria tornata normale: ${e.detail.usagePercent}%`);
});

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  
  // Aggiorna monitors
  fpsMonitor.update();
  memoryMonitor.update(currentTime);
  
  renderer.render(scene, camera);
}

animate();

// Opzionale: mostra stats in tempo reale
setInterval(() => {
  const stats = memoryMonitor.getMemoryStats();
  if (stats) {
    console.log(`Memoria: ${stats.usedMB}MB / ${stats.limitMB}MB (${stats.usagePercent}%)`);
  }
}, 5000);
*/

export default MemoryMonitor;