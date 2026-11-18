import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
  // NO_HMR=1 serves without hot reload, for automated play tests while files are changing.
  server: process.env.NO_HMR ? { hmr: false, watch: null } : {},
  plugins: [
    VitePWA({
      // 'prompt': a new version waits until the player is on the menu (see src/main.js), so it never reloads mid-game.
      registerType: 'prompt',
      includeAssets: ['icon-180.png', 'icon-192.png', 'icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,webp,avif,svg,woff2,json,glb,mp3,ogg,m4a}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Flight Games',
        short_name: 'Flight Games',
        description: 'Nine offline games for the flight: builders, mysteries, strategy and quiet puzzles.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e1420',
        theme_color: '#0e1420',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
