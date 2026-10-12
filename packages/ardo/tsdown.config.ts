import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin"
import { copyFileSync, mkdirSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { defineConfig } from "tsdown"

import { uiStylesPlugin } from "./ui-styles-plugin.ts"

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
  },
  format: ["esm"],
  dts: true,
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
      "react-router",
      "react-router/dom",
      "@react-router/dev",
      "@react-router/dev/vite",
      "@react-router/dev/routes",
      "@react-router/dev/config",
      "vite",
      /^@typescript\/native(?:\/|$)/,
      "tailwindcss",
      "lucide-react",
      "mermaid",
      /^virtual:ardo\//,
    ],
  },
  plugins: [
    vanillaExtractPlugin({
      identifiers: "short",
    }) as any,
    uiStylesPlugin(),
  ],
  hooks: {
    "build:done": async () => {
      const iconsDir = join("src", "ui", "icons")
      const destIconsDir = join("dist", "ui", "icons")
      mkdirSync(destIconsDir, { recursive: true })
      for (const file of readdirSync(iconsDir)) {
        if (file.endsWith(".svg")) {
          copyFileSync(join(iconsDir, file), join(destIconsDir, file))
        }
      }

      console.log("Copied SVG icons to dist/ui/icons/")
    },
  },
})
