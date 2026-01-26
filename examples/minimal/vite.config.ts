import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      title: 'My Documentation',
      description: 'Built with Ardo',

      themeConfig: {
        siteTitle: 'My Docs',

        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'GitHub', link: 'https://github.com/your-org/your-repo' },
        ],

        sidebar: [
          {
            text: 'Guide',
            items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
          },
        ],

        footer: {
          message: 'Released under the MIT License.',
        },

        search: {
          enabled: true,
        },
      },
    }),
  ],
})
