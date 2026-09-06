import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['icons/*.png', 'apple-touch-icon.png', 'images/TOA.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Fonction plutôt que regex : Workbox n'exige un match à
            // l'index 0 que pour les regex, pas pour un matchCallback,
            // ce qui est nécessaire ici car VITE_API_URL peut pointer
            // vers une origine distincte de l'app (cross-origin).
            urlPattern: ({ url }: { url: URL }) => url.pathname.includes('/api/token/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              /\/(documents\/[^/]+\/download|signature\/download)/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'toa-doc-cache',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.includes('/api/'),
            // StaleWhileRevalidate : sert le cache immédiatement (pas
            // d'attente réseau, contrairement à NetworkFirst) puis
            // revalide en arrière-plan si le réseau est disponible.
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'toa-api-cache',
              cacheableResponse: { statuses: [200] },
              expiration: { maxAgeSeconds: 24 * 60 * 60, maxEntries: 200 },
            },
          },
        ],
      },
      manifest: {
        id: '/',
        name: 'TOA HSE',
        short_name: 'TOA',
        lang: 'fr',
        start_url: '/login',
        scope: '/',
        theme_color: '#f9fafb',
        background_color: '#f9fafb',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        // Temporairement repointé vers le backend Docker local pour tester
        // les correctifs non encore déployés sur toa-back.dev.arkeup.com.
        // Remettre "https://toa-back.dev.arkeup.com" une fois les tests finis.
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "virtual:pwa-register/react": path.resolve(
        __dirname,
        "./src/test/virtualPwaRegister.ts",
      ),
    },
  },
});
