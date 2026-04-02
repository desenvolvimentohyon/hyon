import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: false,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Hyon Tech",
        short_name: "Hyon",
        description: "Plataforma de gestão empresarial",
        theme_color: "#1e40af",
        background_color: "#070b14",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      navigateFallbackDenylist: [/^\/proposta/, /^\/portal/, /^\/aceite/, /^\/~oauth/],
      globPatterns: ["index.html"],
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      importScripts: ["sw-push.js"],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: { maxEntries: 30, maxAgeSeconds: 5 * 60 },
            networkTimeoutSeconds: 3,
          },
        },
        {
          urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'assets-cache',
            expiration: { maxEntries: 60, maxAgeSeconds: 5 * 60 },
            networkTimeoutSeconds: 3,
          },
        },
      ],
    },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
