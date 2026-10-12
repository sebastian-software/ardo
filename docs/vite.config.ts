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
        current: "v6",
        versions: [
          { id: "v6", label: "6.x", path: "/v6/" },
          { id: "v5", label: "5.x", path: "/v5/" },
          { id: "v4", label: "4.x", path: "/v4/" },
          { id: "v3", label: "3.x", path: "/v3/" },
        ],
      },

      // Native TypeScript API documentation
      api: {
        entryPoints: ["../packages/ardo/src/index.ts"],
        tsconfig: "../packages/ardo/tsconfig.api.json",
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
