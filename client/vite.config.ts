import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Copy Cesium static assets to dist
    viteStaticCopy({
      targets: [
        { src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Workers'), dest: 'cesium' },
        { src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'), dest: 'cesium' },
        { src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Assets'), dest: 'cesium' },
        { src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'), dest: 'cesium' },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
          cesium: ['cesium'],
          'page-flights': ['./src/modules/flights/FlightsPage'],
          'page-maritime': ['./src/modules/maritime/MaritimePage'],
          'page-cyber': ['./src/modules/cyber/CyberPage'],
          'page-globe': ['./src/modules/globe/GlobePage'],
        },
      },
    },
  },
});
