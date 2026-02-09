import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Basic Example",
      description: "A simple documentation site built with Ardo",

      themeConfig: {
        nav: [{ text: "Guide", link: "/guide/getting-started" }],

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
