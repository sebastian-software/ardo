import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { ardoPlugin } from 'ardo/vite'

export default defineConfig({
  base: '/ardo/',
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    react(),
    ardoPlugin(),
  ],
  optimizeDeps: {
    exclude: ['ardo/theme/styles.css'],
  },
  ssr: {
    noExternal: ['ardo'],
  },
})
