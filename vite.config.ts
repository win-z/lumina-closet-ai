import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
          '/health': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
          '/cos-image': {
            target: 'https://5205210-1320011806.cos.ap-guangzhou.myqcloud.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/cos-image/, ''),
            configure: (proxy, options) => {
              proxy.on('proxyRes', (proxyRes, req, res) => {
                // 添加 CORS 头
                proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.DOUBAO_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
