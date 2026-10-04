import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /site0614/, adjust if the repo is renamed.
  base: '/site0614/',
  plugins: [react(), tailwindcss()],
})
