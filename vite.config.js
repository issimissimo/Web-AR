import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path'

export default defineConfig({
  base: './',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
  server: {
    // Non cambiare porta automaticamente: ci serve sapere sempre
    // quale porta usa il dev-server
    strictPort: true,
    // Ascolta su tutte le interfacce di rete (LAN, localhost, ecc.)
    host: '0.0.0.0',
    // Accetta tutti i sottodomini di trycloudflare.com
    // la stringa che inizia con '.' abilita il wildcard matching
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [solid()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@views': resolve(__dirname, './src/views'),
      '@components': resolve(__dirname, './src/components'),
      '@js': resolve(__dirname, './src/js'),
      '@tools': resolve(__dirname, './src/tools'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@plugins': resolve(__dirname, './src/plugins'),
    }
  }
});
