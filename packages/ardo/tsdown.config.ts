import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin"
import { defineConfig } from "tsdown"

import { uiStylesPlugin } from "./ui-styles-plugin.ts"

// rolldown-plugin-dts only picks the native generator for TypeScript 7.0, so
// point it at the tsgo binary of the installed TypeScript 7.1 instead of
// letting it fall back to the JavaScript compiler API that TypeScript 7 removed.
const typescriptRoot = path.dirname(
  createRequire(import.meta.url).resolve("typescript/package.json")
)
const { default: getTsgoPath } = (await import(
  pathToFileURL(path.join(typescriptRoot, "lib/getExePath.js")).href
)) as { default: () => string }

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "config/index": "src/config/index.ts",
    "vite/index": "src/vite/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "ui/index": "src/ui/index.ts",
    "icons/index": "src/icons/index.ts",
    "api/index": "src/api/index.ts",
    "mdx/provider": "src/mdx/provider.tsx",
    "theme/index": "src/ui/theme/index.ts",
    "ui/styles": "src/ui/styles.css.ts",
    "cli/index": "src/cli/index.ts",
    "react/index": "src/react/index.ts",
    "react/jsx-runtime": "src/react/jsx-runtime.ts",
    "react/jsx-dev-runtime": "src/react/jsx-dev-runtime.ts",
    "react-dom/index": "src/react-dom/index.ts",
    "react-dom/client": "src/react-dom/client.ts",
    "react-dom/server": "src/react-dom/server.ts",
    "react-dom/static": "src/react-dom/static.ts",
    "entries/client": "src/entries/client.tsx",
    "entries/server": "src/entries/server.tsx",
  },
  format: ["esm"],
  dts: { generator: "tsgo", tsgo: { path: getTsgoPath() } },
  sourcemap: true,
  clean: true,
  fixedExtension: false,
  outExtensions: () => ({
    js: ".js",
    dts: ".d.ts",
  }),
  deps: {
    neverBundle: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "vite",
      /^@typescript\/native(?:\/|$)/,
      "tailwindcss",
      /^virtual:ardo\//,
    ],
  },
  plugins: [
    vanillaExtractPlugin({
      identifiers: "short",
    }) as any,
    uiStylesPlugin(),
  ],
})
