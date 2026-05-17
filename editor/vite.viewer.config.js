import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../public/editor-assets/js'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'js/logo-blocks-viewer.js'),
      output: {
        entryFileNames: 'logo-blocks-viewer.js',
        format: 'iife',
        name: 'LogoBlocksViewerBundle',
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: false,
});
