import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  // For GitHub Pages subdirectory deployments, uncomment and adjust:
  // base: '/{{PROJECT_NAME}}/',

  plugins: [
    ardo({
      title: '{{SITE_TITLE}}',
      description: 'Built with Ardo',

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
