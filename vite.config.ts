import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3000',
            changeOrigin: true,
          },
          '/health': {
            target: 'http://127.0.0.1:3000',
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
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          // 自动更新策略：每次构建时检查更新
          workbox: {
            // 缓存策略：StaleWhileRevalidate - 先返回缓存，同时后台更新
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/5205210-1320011806\.cos\.ap-guangzhou\.myqcloud\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cos-images-cache',
                  expiration: {
                    maxEntries: 500,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/api\.siliconflow\.cn\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 24 * 60 * 60, // 1天
                  },
                },
              },
            ],
            // 跳过等待，立即激活新版本
            skipWaiting: true,
            clientsClaim: true,
          },
          manifest: {
            name: 'Lumina Closet AI',
            short_name: 'ClosetAI',
            description: 'AI智能衣橱助手 - 管理服装、获取穿搭建议、虚拟试穿',
            theme_color: '#6366f1',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            orientation: 'portrait',
            icons: [
              {
                src: '/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'maskable any'
              },
              {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any'
              }
            ],
            categories: ['lifestyle', 'productivity'],
            lang: 'zh-CN',
            dir: 'ltr',
            // iOS 特定配置
            apple_touch_icon: '/icon-192x192.png',
            // 截图（应用商店展示用）
            screenshots: [
              {
                src: '/screenshot-1.png',
                sizes: '393x852',
                type: 'image/png',
                form_factor: 'narrow'
              },
              {
                src: '/screenshot-2.png',
                sizes: '393x852',
                type: 'image/png',
                form_factor: 'narrow'
              }
            ],
            // 相关应用
            related_applications: [],
            prefer_related_applications: false
          },
          // 开发模式下也启用PWA以便测试
          devOptions: {
            enabled: true,
            type: 'module'
          },
          // 自定义 Service Worker 注入点，用于处理更新
          injectRegister: 'auto',
        })
      ],
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
