import { execSync } from 'child_process';
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

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
  host: 'ftp.issimissimo.com',
  user: 'd.suppo@issimissimo.com',
  password: '/wfC1^b#m124',
  secure: false // Cambia in true se usi FTPS
};

const VERSION = packageJson.version;
const DIST_FOLDER = './build';
const REMOTE_BASE = '/issimissimo.com/public_html/prod/AR-Web'; // Percorso base sul server FTP

// Verifica se è un deploy in staging
const IS_STAGING = process.argv.includes('--staging');

// ============================================
// FUNZIONI HELPER
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
 */
async function clearRemoteDirectory(client, remoteDir) {
  try {
    await client.removeDir(remoteDir);
    await client.ensureDir(remoteDir);
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

  console.log('╔═══════════════════════════════════════════╗');
  console.log(`║  ${deployTypeEmoji} Deploy ${deployType} v${VERSION.padEnd(18)} ║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // STEP 1: Build
    console.log('📦 Step 1/3: Building...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Build completata\n');

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
      // DEPLOY STAGING: solo upload in /staging (sovrascrive)
      console.log(`📤 Step 3/3: Upload in /${path.basename(REMOTE_BASE)}/staging/`);
      const stagingPath = `${REMOTE_BASE}/staging`;
      await clearRemoteDirectory(client, stagingPath);
      await uploadDirectory(client, DIST_FOLDER, stagingPath);
      console.log('\n✓ Staging aggiornato\n');

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