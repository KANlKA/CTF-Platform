import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [], // Keep empty to ensure dependencies aren't externalized
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react', 'monaco-editor'], // Move monaco to its own chunk
          xterm: ['xterm', 'xterm-addon-fit'],
          react: ['react', 'react-dom'],
          vendor: ['lodash', 'axios']
        }
      }
    }
  }
});