import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "config/index": "src/config/index.ts",
    "vite/index": "src/vite/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "ui/index": "src/ui/index.ts",
    "icons/index": "src/icons/index.ts",
    "typedoc/index": "src/typedoc/index.ts",
    "typedoc/components/index": "src/typedoc/components/index.ts",
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
      "tailwindcss",
      "lucide-react",
      /^virtual:ardo\//,
    ],
  },
  plugins: [
    vanillaExtractPlugin({
      identifiers: "short",
    }) as any,
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

      const stylesEntryPath = join("dist", "ui", "styles.js")
      const stylesOutputPath = join("dist", "ui", "styles.css")
      if (existsSync(stylesEntryPath)) {
        const stylesEntry = readFileSync(stylesEntryPath, "utf8")
        const cssChunks = [...stylesEntry.matchAll(/import\s+"(.+?\.css)";/g)]
          .map((match) => resolve(dirname(stylesEntryPath), match[1]))
          .filter((filePath) => existsSync(filePath))

        const bundledCss = cssChunks.map((filePath) => readFileSync(filePath, "utf8")).join("\n")
        writeFileSync(stylesOutputPath, bundledCss)
      }

      console.log("Copied SVG icons to dist/ui/icons/")
    },
  },
})
