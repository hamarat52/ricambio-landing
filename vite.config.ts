import { existsSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Optional drop-in model: if public/models/car.glb exists when the dev server
// starts (or at build time), it replaces the procedural car body.
const hasCarGlb = existsSync('public/models/car.glb')

// base './' keeps every asset path relative, so the built site works from any
// sub-path (static hosting, a shared link, or opening dist/ directly).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __CAR_GLB__: JSON.stringify(hasCarGlb) },
  server: { port: 5173, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
})
