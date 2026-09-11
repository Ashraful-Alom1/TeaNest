import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tea-nest/types': path.resolve(__dirname, '../../packages/types/src'),
      '@tea-nest/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tea-nest/validation': path.resolve(__dirname, '../../packages/validation/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy /admin (and all assets, HMR WS) to the admin dev server
      '^/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !(res as any).headersSent) {
              (res as any).writeHead(503, { 'Content-Type': 'text/plain' });
              (res as any).end('Admin dev server initializing');
            } else if (res && typeof (res as any).destroy === 'function') {
              (res as any).destroy();
            }
          });
        },
      },
      // Proxy /api directly to the Tea Nest Backend Server on port 5001
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
