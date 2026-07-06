import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["examples/**/*.test.ts", "packages/create-ardo/src/scaffold.integration.test.ts"],
    testTimeout: 120_000,
  },
})
