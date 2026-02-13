import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      title: '{{SITE_TITLE}}',
      description: '{{DESCRIPTION}}',

      {{TYPEDOC_CONFIG}}

      {{GITHUB_PAGES_CONFIG}}

      themeConfig: {
        siteTitle: '{{SITE_TITLE}}',

        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          {{TYPEDOC_NAV}}
        ],

        sidebar: [
          {
            text: 'Guide',
            items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
          },
          {{TYPEDOC_SIDEBAR}}
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
