import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8000,
    strictPort: true,
    proxy: {
      '/api/detect-multi-overview': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/outputs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
