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
    chunkSizeWarningLimit: 1000, // Optional
    rollupOptions: {
      external: [], // <-- ✅ Prevents Vite from externalizing monaco
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react', 'monaco-editor'],
          xterm: ['xterm', 'xterm-addon-fit'],
          react: ['react', 'react-dom'],
          vendor: ['lodash', 'axios']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'xterm',
      'xterm-addon-fit',
      '@monaco-editor/react'
    ],
    exclude: ['xterm/css/xterm.css']
  }
});
