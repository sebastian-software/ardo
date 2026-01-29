import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'
// import { typedocPlugin } from 'ardo/typedoc'

export default defineConfig({
  // For GitHub Pages subdirectory deployments, uncomment and adjust:
  // base: '/{{PROJECT_NAME}}/',

  plugins: [
    // TypeDoc API documentation generator (uncomment to enable)
    // typedocPlugin({
    //   contentDir: './content',
    //   config: {
    //     enabled: true,
    //     entryPoints: ['./src/index.ts'],
    //     tsconfig: './tsconfig.json',
    //     out: 'api-reference',
    //     excludePrivate: true,
    //     excludeInternal: true,
    //   },
    // }),

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
