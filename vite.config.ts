import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-512x512-maskable.png',
        'pwa-192x192.svg',
        'pwa-512x512.svg',
        'screenshots/wide.png',
        'screenshots/narrow.png',
        'wasm/*.wasm',
        'wasm/*.js',
        'models/*.task',
        'media/*'
      ],
      manifest: {
        id: '/',
        name: 'AeroTouch — AI Hand Gesture Studio',
        short_name: 'AeroTouch',
        description: 'Touchless hand gesture control studio with low-latency in-browser AI',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0B1020',
        background_color: '#0B1020',
        categories: ['utilities', 'productivity', 'accessibility'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'AeroTouch Studio Desktop Mode'
          },
          {
            src: '/screenshots/narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'AeroTouch Studio Mobile View'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30 MB to precache MediaPipe WASM & .task models
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,task,wav,mp3,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
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
          }
        ]
      }
    })
  ]
});
