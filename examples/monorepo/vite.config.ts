import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Monorepo Example",
      description: "A monorepo documentation site with multiple TypeDoc entry points",

      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Alpha API", link: "/api-reference/alpha" },
          { text: "Beta API", link: "/api-reference/beta" },
        ],

        footer: {
          message: "Built with Ardo",
        },

        search: {
          enabled: true,
        },
      },
    }),
  ],
})
