import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'wasm/*.wasm',
        'wasm/*.js',
        'models/*.task',
        'gesture_recognizer.task'
      ],
      manifest: {
        name: 'AeroTouch — AI Hand Gesture Studio',
        short_name: 'AeroTouch',
        description: 'Next-gen touchless hand gesture interface with offline WebAssembly AI',
        theme_color: '#0B1020',
        background_color: '#0B1020',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30 MB to precache MediaPipe WASM & .task models
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,task}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/wasm/') || url.pathname.endsWith('.task'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ]
});
