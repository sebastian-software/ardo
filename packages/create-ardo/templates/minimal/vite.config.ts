import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      title: '{{SITE_TITLE}}',
      description: 'Built with Ardo',

      // TypeDoc API documentation (uncomment to enable)
      // Generates docs from ./src/index.ts into content/api-reference/
      // typedoc: true,

      // GitHub Pages base path is auto-detected from git remote.
      // Set githubPages: false to disable, or set base manually in defineConfig.

      themeConfig: {
        siteTitle: '{{SITE_TITLE}}',

        nav: [{ text: 'Guide', link: '/guide/getting-started' }],

        sidebar: [
          {
            text: 'Guide',
            items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
          },
        ],

        footer: {
          message: 'Built with Ardo',
        },

        search: {
          enabled: true,
        },
      },
    }),
  ],
})
