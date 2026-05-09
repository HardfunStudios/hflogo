import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../public/editor-assets/js'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'js/logo-worker-entry.js'),
      output: {
        entryFileNames: 'logo-worker-v2.js',
        format: 'iife',
        name: 'LogoWorker',
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: false,
});
