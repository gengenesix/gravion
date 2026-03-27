import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
          'page-flights': ['./src/modules/flights/FlightsPage'],
          'page-maritime': ['./src/modules/maritime/MaritimePage'],
          'page-cyber': ['./src/modules/cyber/CyberPage'],
        },
      },
    },
  },
});
