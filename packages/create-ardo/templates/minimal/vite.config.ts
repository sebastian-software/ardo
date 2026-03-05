import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    ardo({
      title: '{{SITE_TITLE}}',
      description: '{{DESCRIPTION}}',

      {{TYPEDOC_CONFIG}}

      {{GITHUB_PAGES_CONFIG}}
    }),
  ],
})
