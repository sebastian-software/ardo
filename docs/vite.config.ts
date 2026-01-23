import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { reactPressPlugin } from 'react-press/vite'

export default defineConfig({
  base: '/react-press/',
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    react(),
    reactPressPlugin(),
  ],
  optimizeDeps: {
    exclude: ['react-press/theme/styles.css'],
  },
  ssr: {
    noExternal: ['react-press'],
  },
})
