import { execSync } from 'child_process';
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ftpCredentials } from './CREDENTIALS.js';

// Necessario per usare __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Per leggere package.json
const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

// ============================================
// CONFIGURAZIONE
// ============================================
const FTP_CONFIG = {
  host: ftpCredentials.host,
  user: ftpCredentials.user,
  password: ftpCredentials.password,
  secure: false // Cambia in true se usi FTPS
};

const VERSION = packageJson.version;
const DIST_FOLDER = './build';
const REMOTE_BASE = '/issimissimo.com/public_html/prod/AR-Web'; // Percorso base sul server FTP
const INDEX_HTML_PATH = path.join(__dirname, 'src', 'index.html'); // Percorso del file index.html
const APP_CONFIG_PATH = path.join(__dirname, 'public', 'appConfig.json'); // Percorso del file appConfig.json

// Verifica se è un deploy in staging
const IS_STAGING = process.argv.includes('--staging');

// ============================================
// FUNZIONI HELPER PER GESTIONE LAUNCHAR SCRIPT
// ============================================

/**
 * Pattern per trovare lo script launchar (sia commentato che non)
 */
const LAUNCHAR_PATTERN = /(\s*)(<!--\s*)?(<script src="https:\/\/launchar\.app\/sdk\/v1\?key=[^"]+"><\/script>)(\s*-->)?/;

/**
 * Uncommenta lo script launchar nel file index.html
 * @returns {string|null} Il contenuto originale del file, o null se non trovato
 */
function uncommentLauncharScript() {
  try {
    if (!fs.existsSync(INDEX_HTML_PATH)) {
      console.warn(`⚠️  File index.html non trovato in: ${INDEX_HTML_PATH}`);
      return null;
    }

    const originalContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    
    // Verifica se lo script è presente
    if (!LAUNCHAR_PATTERN.test(originalContent)) {
      console.warn('⚠️  Script launchar non trovato in index.html');
      return null;
    }

    // Uncommenta lo script
    const uncommentedContent = originalContent.replace(
      LAUNCHAR_PATTERN,
      '$1$3' // Mantiene l'indentazione ($1) e lo script ($3), rimuove i commenti
    );

    // Verifica che sia cambiato qualcosa
    if (originalContent === uncommentedContent) {
      console.log('ℹ️  Script launchar era già uncommentato');
      return originalContent; // Restituiamo comunque il contenuto per sicurezza
    }

    // Salva la versione uncommentata
    fs.writeFileSync(INDEX_HTML_PATH, uncommentedContent, 'utf8');
    console.log('✓ Script launchar uncommentato per il deploy');
    
    return originalContent;
  } catch (err) {
    console.error('❌ Errore durante uncomment dello script:', err.message);
    return null;
  }
}

/**
 * Ripristina il contenuto originale del file index.html
 * @param {string} originalContent - Il contenuto originale da ripristinare
 */
function restoreIndexHtml(originalContent) {
  try {
    if (!originalContent) {
      console.warn('⚠️  Nessun contenuto index.html da ripristinare');
      return;
    }

    fs.writeFileSync(INDEX_HTML_PATH, originalContent, 'utf8');
    console.log('✓ File index.html ripristinato allo stato originale');
  } catch (err) {
    console.error('❌ Errore durante il ripristino di index.html:', err.message);
  }
}

// ============================================
// FUNZIONI HELPER PER GESTIONE APPCONFIG.JSON
// ============================================

/**
 * Modifica appConfig.json impostando i parametri debug a false
 * @returns {string|null} Il contenuto originale del file, o null se non trovato
 */
function setProductionConfig() {
  try {
    if (!fs.existsSync(APP_CONFIG_PATH)) {
      console.warn(`⚠️  File appConfig.json non trovato in: ${APP_CONFIG_PATH}`);
      return null;
    }

    const originalContent = fs.readFileSync(APP_CONFIG_PATH, 'utf8');
    
    // Parse del JSON
    let config;
    try {
      config = JSON.parse(originalContent);
    } catch (parseErr) {
      console.error('❌ Errore nel parsing di appConfig.json:', parseErr.message);
      return null;
    }

    // Verifica se ci sono modifiche da fare
    const needsChange = config.debugOnDesktop !== false || config.debugLoadMode !== false;
    
    if (!needsChange) {
      console.log('ℹ️  appConfig.json ha già i valori corretti per produzione');
      return originalContent; // Restituiamo comunque il contenuto per sicurezza
    }

    // Crea una copia della config e modifica solo i campi necessari
    const productionConfig = { ...config };
    productionConfig.debugOnDesktop = false;
    productionConfig.debugLoadMode = false;
    
    // Opzionalmente, puoi anche forzare production: true
    // productionConfig.production = true;

    // Converti in JSON con formattazione leggibile (2 spazi di indentazione)
    const productionContent = JSON.stringify(productionConfig, null, 2);

    // Salva la versione di produzione
    fs.writeFileSync(APP_CONFIG_PATH, productionContent, 'utf8');
    
    console.log('✓ appConfig.json configurato per produzione:');
    console.log('  • debugOnDesktop: false');
    console.log('  • debugLoadMode: false');
    
    return originalContent;
  } catch (err) {
    console.error('❌ Errore durante modifica di appConfig.json:', err.message);
    return null;
  }
}

/**
 * Ripristina il contenuto originale del file appConfig.json
 * @param {string} originalContent - Il contenuto originale da ripristinare
 */
function restoreAppConfig(originalContent) {
  try {
    if (!originalContent) {
      console.warn('⚠️  Nessun contenuto appConfig.json da ripristinare');
      return;
    }

    fs.writeFileSync(APP_CONFIG_PATH, originalContent, 'utf8');
    console.log('✓ File appConfig.json ripristinato allo stato originale');
  } catch (err) {
    console.error('❌ Errore durante il ripristino di appConfig.json:', err.message);
  }
}

// ============================================
// FUNZIONI HELPER FTP
// ============================================

/**
 * Upload ricorsivo di una cartella via FTP
 */
async function uploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir);
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    const stat = fs.statSync(localPath);
    
    if (stat.isDirectory()) {
      // Crea la directory remota e continua ricorsivamente
      await client.ensureDir(remotePath);
      await uploadDirectory(client, localPath, remotePath);
    } else {
      // Upload del file
      await client.uploadFrom(localPath, remotePath);
      process.stdout.write('.');
    }
  }
}

/**
 * Rimuove tutti i file in una directory remota
 * @param {boolean} preserveHtaccess - Se true, mantiene il file .htaccess
 */
async function clearRemoteDirectory(client, remoteDir, preserveHtaccess = false) {
  try {
    if (preserveHtaccess) {
      // Scarica .htaccess se esiste
      let htaccessContent = null;
      const htaccessPath = `${remoteDir}/.htaccess`;
      try {
        const tempHtaccess = path.join(__dirname, '.htaccess.temp');
        await client.downloadTo(tempHtaccess, htaccessPath);
        htaccessContent = fs.readFileSync(tempHtaccess, 'utf8');
        fs.unlinkSync(tempHtaccess);
      } catch (err) {
        // .htaccess non esiste, va bene così
      }
      
      // Rimuove tutto
      await client.removeDir(remoteDir);
      await client.ensureDir(remoteDir);
      
      // Ripristina .htaccess se esisteva
      if (htaccessContent) {
        const tempHtaccess = path.join(__dirname, '.htaccess.temp');
        fs.writeFileSync(tempHtaccess, htaccessContent);
        await client.uploadFrom(tempHtaccess, htaccessPath);
        fs.unlinkSync(tempHtaccess);
      }
    } else {
      // Comportamento normale: rimuove tutto
      await client.removeDir(remoteDir);
      await client.ensureDir(remoteDir);
    }
  } catch (err) {
    // Se la directory non esiste, la creiamo
    await client.ensureDir(remoteDir);
  }
}

// ============================================
// FUNZIONE PRINCIPALE
// ============================================

async function deploy() {
  const deployType = IS_STAGING ? 'STAGING' : 'PRODUZIONE';
  const deployTypeEmoji = IS_STAGING ? '🧪' : '🚀';
  
  let originalIndexContent = null;
  let originalAppConfigContent = null;

  console.log('╔═══════════════════════════════════════════╗');
  console.log(`║  ${deployTypeEmoji} Deploy ${deployType} v${VERSION.padEnd(18)} ║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // STEP 0: Preparazione file per produzione
    console.log('🔧 Step 0/3: Preparazione file per produzione...');
    
    // Uncommenta script launchar
    originalIndexContent = uncommentLauncharScript();
    
    // Imposta configurazione di produzione
    originalAppConfigContent = setProductionConfig();
    
    console.log('');

    // STEP 1: Build
    console.log('📦 Step 1/3: Building...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Build completata\n');

    // STEP 1.5: Ripristina immediatamente i file originali
    console.log('🔄 Ripristino file di sviluppo...');
    restoreIndexHtml(originalIndexContent);
    restoreAppConfig(originalAppConfigContent);
    console.log('');

    // Verifica che la cartella dist esista
    if (!fs.existsSync(DIST_FOLDER)) {
      throw new Error(`Cartella ${DIST_FOLDER} non trovata!`);
    }

    // STEP 2: Connessione FTP
    console.log('🔌 Step 2/3: Connessione al server FTP...');
    const client = new ftp.Client();
    client.ftp.verbose = false; // Disabilita log verbosi
    
    await client.access(FTP_CONFIG);
    console.log('✓ Connesso al server\n');

    if (IS_STAGING) {
      // DEPLOY STAGING: solo upload in /staging (sovrascrive, ma preserva .htaccess)
      console.log(`📤 Step 3/3: Upload in /${path.basename(REMOTE_BASE)}/staging/`);
      const stagingPath = `${REMOTE_BASE}/staging`;
      await clearRemoteDirectory(client, stagingPath, true); // true = preserva .htaccess
      await uploadDirectory(client, DIST_FOLDER, stagingPath);
      console.log('\n✓ Staging aggiornato (preservato .htaccess)\n');
      
    } else {
      // DEPLOY PRODUZIONE: upload versione + current
      
      // STEP 3a: Upload nella cartella versionata
      console.log(`📤 Step 3a/3: Upload in /${path.basename(REMOTE_BASE)}/${VERSION}/`);
      const versionedPath = `${REMOTE_BASE}/${VERSION}`;
      await client.ensureDir(versionedPath);
      await uploadDirectory(client, DIST_FOLDER, versionedPath);
      console.log('\n✓ Versione backup salvata\n');

      // STEP 3b: Upload nella cartella "current"
      console.log(`📤 Step 3b/3: Upload in /${path.basename(REMOTE_BASE)}/current/`);
      const currentPath = `${REMOTE_BASE}/current`;
      await clearRemoteDirectory(client, currentPath);
      await uploadDirectory(client, DIST_FOLDER, currentPath);
      console.log('\n✓ Versione corrente aggiornata\n');
    }

    client.close();

    // SUCCESSO
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Deploy completato con successo!   ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    
    if (IS_STAGING) {
      console.log('🌐 Link disponibile:');
      console.log(`   → Staging: www.miositoweb${REMOTE_BASE}/staging/\n`);
    } else {
      console.log('🌐 Link disponibili:');
      console.log(`   → Principale: www.miositoweb${REMOTE_BASE}/current/`);
      console.log(`   → Backup:     www.miositoweb${REMOTE_BASE}/${VERSION}/\n`);
    }

  } catch (err) {
    console.error('\n❌ Errore durante il deploy:', err.message);
    
    // In caso di errore, assicurati di ripristinare i file originali
    if (originalIndexContent || originalAppConfigContent) {
      console.log('\n🔄 Ripristino file dopo errore...');
      if (originalIndexContent) {
        restoreIndexHtml(originalIndexContent);
      }
      if (originalAppConfigContent) {
        restoreAppConfig(originalAppConfigContent);
      }
    }
    
    process.exit(1);
  }
}

// ============================================
// ESECUZIONE
// ============================================

// Chiedi conferma prima di procedere
const deployType = IS_STAGING ? 'STAGING' : 'PRODUZIONE';
console.log(`Stai per deployare in ${deployType} - versione ${VERSION}`);
console.log(`Server: ${FTP_CONFIG.host}`);
console.log(`Percorso: ${REMOTE_BASE}\n`);

// Per saltare la conferma, usa: npm run deploy -- --skip-confirm
const skipConfirm = process.argv.includes('--skip-confirm');

if (skipConfirm) {
  deploy();
} else {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Procedere? (y/n): ', (answer) => {
    readline.close();
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      deploy();
    } else {
      console.log('Deploy annullato.');
      process.exit(0);
    }
  });
}