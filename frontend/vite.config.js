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
    chunkSizeWarningLimit: 1000, // Increase warning threshold (optional)
    rollupOptions: {
      output: {
        manualChunks: {
          xterm: ['xterm', 'xterm-addon-fit'],
          react: ['react', 'react-dom'],
          vendor: ['lodash', 'axios'] // Add other large dependencies
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'xterm',
      'xterm-addon-fit',
      '@monaco-editor/react',
      'monaco-editor',
    ],
    exclude: ['xterm/css/xterm.css']
  }
});