import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      title: '{{SITE_TITLE}}',
      description: 'Built with Ardo',

      {{TYPEDOC_CONFIG}}

      {{GITHUB_PAGES_CONFIG}}

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
