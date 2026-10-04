import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /shlokmsite/, adjust if the repo is renamed.
  base: '/shlokmsite/',
  plugins: [react(), tailwindcss()],
})
