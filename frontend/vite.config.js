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
      external: ['@monaco-editor/react'], // <-- ✅ Prevents Vite from externalizing monaco
      output: {
        manualChunks: {
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
    '@monaco-editor/react',
    'monaco-editor' // Add this if not already there
  ],
  exclude: ['xterm/css/xterm.css']
}
});
