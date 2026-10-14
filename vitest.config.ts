import { fileURLToPath } from "node:url"

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  resolve: {
    alias: {
      "virtual:ardo/generated-sidebars": fileURLToPath(
        new URL("./.storybook/mocks/generated-sidebars.ts", import.meta.url)
      ),
      "virtual:ardo/search-index": fileURLToPath(
        new URL("./.storybook/mocks/search-index.ts", import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    fileParallelism: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "scripts/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "packages/ardo/src/api/**/*.ts",
        "packages/ardo/src/generated-docs.ts",
        "packages/ardo/src/markdown/**/*.{ts,tsx}",
        "packages/ardo/src/runtime/**/*.{ts,tsx}",
        "packages/ardo/src/vite/**/*.{ts,tsx}",
      ],
      exclude: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}"],
      thresholds: {
        branches: 18,
        functions: 18,
        lines: 18,
        statements: 18,
      },
    },
  },
})
