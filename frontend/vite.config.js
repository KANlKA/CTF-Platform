import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,

    // Needed for Google OAuth popup
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },

    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },

      '/avatars': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },

      '/challenge-files': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
