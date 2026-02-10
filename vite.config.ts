/**
 * @file vite.config.ts
 * @description Vite bundler configuration for the Idoneo application.
 *
 * ## Key Features Configured
 *
 * - **Development Server**: Port 3000 with network access (0.0.0.0)
 * - **React Plugin**: Fast Refresh for development
 * - **PWA Plugin**: Service worker and manifest generation
 * - **Compression**: Both Gzip and Brotli for production builds
 * - **Code Splitting**: Manual chunks for optimal caching
 *
 * ## Build Optimizations
 *
 * Manual chunks separate vendor code for better cache utilization:
 * - `react-vendor`: React core (rarely changes)
 * - `router`: React Router DOM
 * - `framer`: Framer Motion animations
 * - `supabase`: Supabase SDK
 * - `icons`: Lucide React icons
 *
 * ## Path Aliases
 *
 * - `@/` maps to `./src/` for clean imports
 *
 * @see https://vitejs.dev/config/
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      // Gzip compression
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Brotli compression (better than gzip)
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['icon.svg', 'icon-192x192.png', 'icon-512x512.png'],
        manifest: {
          name: 'Idoneo',
          short_name: 'Idoneo',
          description: 'La piattaforma per i tuoi concorsi',
          theme_color: '#0F172A',
          background_color: '#0F172A',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          id: '/',
          icons: [
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime - rarely changes
            'react-vendor': ['react', 'react-dom'],
            // Router - rarely changes
            'router': ['react-router-dom'],
            // Animation library - medium size
            'framer': ['framer-motion'],
            // Backend SDK - rarely changes
            'supabase': ['@supabase/supabase-js'],
            // Icons - can be large
            'icons': ['lucide-react'],
          }
        }
      },
      // Increase chunk size warning to avoid noise
      chunkSizeWarningLimit: 600,
      target: 'es2015',
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  };
});
