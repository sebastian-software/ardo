import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'
import { typedocPlugin } from 'ardo/typedoc'

export default defineConfig({
  base: '/ardo/',
  plugins: [
    typedocPlugin({
      contentDir: './content',
      config: {
        enabled: true,
        entryPoints: ['../packages/ardo/src/index.ts'],
        tsconfig: '../packages/ardo/tsconfig.json',
        out: 'api-reference',
        excludePrivate: true,
        excludeInternal: true,
        sort: ['source-order'],
        markdown: {
          sourceLinks: true,
          sourceBaseUrl: 'https://github.com/sebastian-software/ardo/blob/main/packages/ardo',
        },
      },
    }),
    ardo({
      // Site metadata (used for SEO defaults)
      title: 'Ardo',
      description: 'React-first Static Documentation Framework',

      // Theme config for features still used by components
      themeConfig: {
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

      // Markdown processing options
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
