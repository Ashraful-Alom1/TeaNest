import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tea-nest/types': path.resolve(__dirname, '../../packages/types/src'),
      '@tea-nest/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tea-nest/validation': path.resolve(__dirname, '../../packages/validation/src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      '^/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !(res as any).headersSent) {
              (res as any).writeHead(503, { 'Content-Type': 'application/json' });
              (res as any).end(JSON.stringify({ error: 'Backend API initializing' }));
            } else if (res && typeof (res as any).destroy === 'function') {
              (res as any).destroy();
            }
          });
        },
      },
    },
  },
});
