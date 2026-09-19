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
        // Le service worker en dev masque les changements (cache) : activer explicitement avec
        // VITE_PWA_DEV=true uniquement pour tester le PWA / le hors-ligne.
        enabled: process.env.VITE_PWA_DEV === 'true',
      },
      includeAssets: ['icons/*.png', 'apple-touch-icon.png', 'images/TOA.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Stratégie API : les données en ligne doivent toujours être fraîches (statuts, consultations,
        // documents, PDF). Le hors-ligne est assuré par la persistance React Query, le snapshot IndexedDB
        // et le cache des documents ; le cache Workbox ci-dessous n'est qu'un dernier recours réseau.
        runtimeCaching: [
          {
            // Fonctions plutôt que regex : Workbox n'exige un match à l'index 0 que pour les regex,
            // pas pour un matchCallback, ce qui est nécessaire ici car VITE_API_URL peut pointer vers
            // une origine distincte de l'app (cross-origin).
            //
            // Jamais en cache : authentification, sondage d'état des PDF (doit refléter l'état réel)
            // et snapshot hors-ligne (volumineux, déjà stocké en IndexedDB).
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes('/api/token/') ||
              url.pathname.includes('/api/login') ||
              url.pathname.includes('/api/offline/snapshot') ||
              /\/(pdf|pv)\/status$/.test(url.pathname),
            handler: 'NetworkOnly',
          },
          {
            // Fichiers de documents (photos, pièces) : le contenu d'un id ne change jamais.
            urlPattern: ({ url }: { url: URL }) => /\/documents\/[^/]+\/download$/.test(url.pathname),
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
            // Tout le reste de l'API (lectures, PDF générés, signature) : réseau d'abord pour ne jamais
            // servir un état périmé en ligne ; le cache ne sert qu'en cas d'échec ou de réseau lent
            // (chantiers à faible couverture).
            urlPattern: ({ url }: { url: URL }) => url.pathname.includes('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'toa-api-cache',
              networkTimeoutSeconds: 5,
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
