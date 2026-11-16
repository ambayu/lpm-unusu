import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:5004',
        changeOrigin: true
      },
      '/sso': {
        target: 'http://localhost:5178',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: 'dist/client'
  }
}))
