import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Library Example",
      description: "A library documentation site with TypeDoc integration",
      githubPages: false,

      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "API", link: "/api-reference" },
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
