import { createRequire } from "node:module"
import path from "node:path"

import type { Plugin } from "vite"

import { defineConfig } from "ardo/vite"
import { ardo } from "ardo/vite"

import { fetchNpmFacts } from "./app/home/npm-facts.ts"

// Ardo's dev server only serves files inside the docs folder. In this pnpm
// workspace the home page fonts resolve to the shared store at the repository
// root, so their packages are allowed explicitly.
const require = createRequire(import.meta.url)
const fontPackages = [
  "@fontsource-variable/bricolage-grotesque",
  "@fontsource-variable/caveat",
  "@fontsource-variable/figtree",
].map((name) => path.dirname(require.resolve(`${name}/package.json`)))

/**
 * Fetch the package's npm facts once per build or dev server, so the
 * prerendered home page and its hydration see the same numbers.
 */
function npmFacts(name: string): Plugin {
  const id = "virtual:docs/npm-facts"
  let facts: ReturnType<typeof fetchNpmFacts> | undefined
  return {
    name: "docs:npm-facts",
    resolveId(source) {
      return source === id ? `\0${id}` : undefined
    },
    async load(source) {
      if (source !== `\0${id}`) return undefined
      facts ??= fetchNpmFacts(name)
      return `export default ${JSON.stringify(await facts)}`
    },
  }
}

export default defineConfig({
  server: { fs: { allow: fontPackages } },
  plugins: [
    npmFacts("ardo"),
    ardo({
      title: "Ardo",
      description: "React-first Static Documentation Framework",
      siteUrl: "https://ardo-docs.dev",
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
        // Import paths make every page show its import line.
        entryPoints: {
          "ardo/ui": "../packages/ardo/src/ui/index.ts",
          "ardo/runtime": "../packages/ardo/src/runtime/index.ts",
          "ardo/config": "../packages/ardo/src/config/index.ts",
        },
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
