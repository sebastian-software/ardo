import { fileURLToPath } from "node:url"

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  resolve: {
    alias: {
      "virtual:ardo/search-index": fileURLToPath(
        new URL("./.storybook/mocks/search-index.ts", import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    fileParallelism: true,
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "packages/create-ardo/src/scaffold.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "packages/ardo/src/markdown/**/*.{ts,tsx}",
        "packages/ardo/src/runtime/**/*.{ts,tsx}",
        "packages/ardo/src/typedoc/**/*.{ts,tsx}",
        "packages/ardo/src/vite/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.stories.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "packages/ardo/src/typedoc/components/**",
      ],
      thresholds: {
        branches: 18,
        functions: 18,
        lines: 18,
        statements: 18,
      },
    },
  },
})
