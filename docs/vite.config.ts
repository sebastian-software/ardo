import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  base: '/ardo/',
  plugins: [
    ardo({
      title: 'Ardo',
      description: 'React-first Static Documentation Framework',

      themeConfig: {
        siteTitle: 'Ardo',

        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/api/config' },
          { text: 'GitHub', link: 'https://github.com/sebastian-software/ardo' },
        ],

        sidebar: [
          {
            text: 'Introduction',
            items: [
              { text: 'What is Ardo?', link: '/guide/what-is-ardo' },
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Framework Comparison', link: '/guide/comparison' },
            ],
          },
          {
            text: 'Writing',
            items: [
              { text: 'Markdown Features', link: '/guide/markdown' },
              { text: 'Frontmatter', link: '/guide/frontmatter' },
            ],
          },
          {
            text: 'Customization',
            items: [
              { text: 'Theme Config', link: '/guide/theme-config' },
              { text: 'Custom Theme', link: '/guide/custom-theme' },
            ],
          },
          {
            text: 'Advanced',
            items: [{ text: 'TypeDoc Integration', link: '/guide/typedoc' }],
          },
          {
            text: 'API Reference',
            items: [
              { text: 'Configuration', link: '/api/config' },
              { text: 'Vite Plugin', link: '/api/vite-plugin' },
              { text: 'Runtime Hooks', link: '/api/runtime' },
              { text: 'Theme Components', link: '/api/components' },
            ],
          },
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/sebastian-software/ardo' }],

        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2026 Sebastian Software GmbH',
        },

        search: {
          enabled: true,
          placeholder: 'Search documentation...',
        },

        editLink: {
          pattern: 'https://github.com/sebastian-software/ardo/edit/main/docs/content/:path',
          text: 'Edit this page on GitHub',
        },

        lastUpdated: {
          enabled: true,
          text: 'Last updated',
        },
      },

      markdown: {
        theme: {
          light: 'github-light',
          dark: 'github-dark',
        },
        lineNumbers: false,
        toc: {
          level: [2, 3],
        },
      },
    }),
  ],
})
