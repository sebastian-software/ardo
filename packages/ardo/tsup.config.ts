import { defineConfig } from "tsup"
import { copyFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "config/index": "src/config/index.ts",
    "vite/index": "src/vite/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "theme/index": "src/theme/index.ts",
    "typedoc/index": "src/typedoc/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@tanstack/react-router",
    "@tanstack/react-start",
    "vite",
    "tailwindcss",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
  onSuccess: async () => {
    // Copy static assets
    const destPath = join("dist", "theme", "styles.css")
    mkdirSync(dirname(destPath), { recursive: true })
    copyFileSync(join("src", "theme", "styles.css"), destPath)
    console.log("Copied styles.css to dist/theme/")
  },
})
