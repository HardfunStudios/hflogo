import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../app/assets/builds'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'js/main.js'),
      external: ['$', 'jQuery', 'Interpreter', 'Microworld'],
      output: {
        entryFileNames: 'logo-editor.js',
        format: 'iife',
        name: 'LogoEditorBundle',
        globals: {
          '$': '$',
          'jQuery': 'jQuery',
          'Interpreter': 'Interpreter',
          'Microworld': 'Microworld',
        },
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: false,
});
