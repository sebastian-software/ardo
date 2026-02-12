import { defineConfig } from "tsup"
import { copyFileSync, mkdirSync, readdirSync } from "fs"
import { dirname, join } from "path"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "config/index": "src/config/index.ts",
    "vite/index": "src/vite/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "ui/index": "src/ui/index.ts",
    "icons/index": "src/icons/index.ts",
    "typedoc/index": "src/typedoc/index.ts",
    "mdx/provider": "src/mdx/provider.tsx",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
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
    "tailwindcss",
    "lucide-react",
    /^virtual:ardo\//,
  ],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
  onSuccess: async () => {
    // Copy static assets
    const destPath = join("dist", "ui", "styles.css")
    mkdirSync(dirname(destPath), { recursive: true })
    copyFileSync(join("src", "ui", "styles.css"), destPath)
    console.log("Copied styles.css to dist/ui/")

    // Copy SVG icons
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
})
