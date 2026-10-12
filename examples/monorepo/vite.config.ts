import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Monorepo Example",
      description: "A monorepo documentation site with native API reference for each package",
      api: [
        {
          entryPoints: ["./packages/alpha/src/index.ts"],
          tsconfig: "./packages/alpha/tsconfig.json",
          out: "api-reference/alpha",
          title: "Alpha API",
        },
        {
          entryPoints: ["./packages/beta/src/index.ts"],
          tsconfig: "./packages/beta/tsconfig.json",
          out: "api-reference/beta",
          title: "Beta API",
        },
      ],
      brand: {
        color: "amber",
        accent: "blue",
        neutral: "slate",
      },
      githubPages: false,
    }),
  ],
})
