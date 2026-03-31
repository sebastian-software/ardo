import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  shims: true,
  fixedExtension: false,
  outExtensions: () => ({
    js: ".js",
    dts: ".d.ts",
  }),
  banner: {
    js: "#!/usr/bin/env node",
  },
})
