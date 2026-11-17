import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.DEV_PORT || 5177)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DEV_PORT must be an integer between 1 and 65535')
  return {
  base: '/',
  plugins: [react()],
  server: {
    port,
    strictPort: true,
    proxy: {
      '/api': {
        target: env.DEV_API_TARGET || 'http://localhost:5004',
        changeOrigin: true
      },
      '/sso': {
        target: env.VITE_ONE_UNUSU_URL || 'http://localhost:5173',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: 'dist/client'
  }
  }
})
