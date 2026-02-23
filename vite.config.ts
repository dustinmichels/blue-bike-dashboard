import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  build: { outDir: 'dist' },
  plugins: [tailwindcss()],
})
