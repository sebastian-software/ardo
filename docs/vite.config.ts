import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo",
      description: "React-first Static Documentation Framework",
      siteUrl: "https://ardo-docs.dev",
      githubPages: false,
      versioning: {
        current: "v3",
        versions: [{ id: "v3", label: "3.x", path: "/v3/" }],
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
