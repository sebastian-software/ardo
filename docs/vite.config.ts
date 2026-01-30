import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo",
      description: "React-first Static Documentation Framework",

      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "API", link: "/api-reference" },
        ],
        socialLinks: [{ icon: "github", link: "https://github.com/sebastian-software/ardo" }],
        search: {
          enabled: true,
          placeholder: "Search documentation...",
        },
        editLink: {
          pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
          text: "Edit this page on GitHub",
        },
        lastUpdated: {
          enabled: true,
          text: "Last updated",
        },
      },

      // TypeDoc API documentation
      typedoc: {
        entryPoints: ["../packages/ardo/src/index.ts"],
        tsconfig: "../packages/ardo/tsconfig.json",
        markdown: {
          sourceLinks: true,
          sourceBaseUrl: "https://github.com/sebastian-software/ardo/blob/main/packages/ardo",
        },
      },

      markdown: {
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        lineNumbers: false,
        toc: {
          level: [2, 3],
        },
      },
    }),
  ],
})
