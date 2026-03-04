import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      title: '{{SITE_TITLE}}',
      description: '{{DESCRIPTION}}',

      {{TYPEDOC_CONFIG}}

      {{GITHUB_PAGES_CONFIG}}
    }),
  ],
})
