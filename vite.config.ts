import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          capacitor: [
            '@capacitor/core',
            '@capacitor/haptics',
            '@capacitor/preferences',
            '@capacitor/screen-orientation',
            '@capacitor/status-bar'
          ]
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  }
});
