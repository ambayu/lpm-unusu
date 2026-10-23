import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:5004',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist/client'
  }
})
