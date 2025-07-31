import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/config/features': mode === 'production' 
        ? path.resolve(__dirname, './src/config/features.prod.ts')
        : path.resolve(__dirname, './src/config/features.dev.ts')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'papaparse', 'xlsx']
        }
      }
    }
  },   
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
}))