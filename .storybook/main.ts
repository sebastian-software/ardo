import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const config: StorybookConfig = {
  stories: ["../packages/ardo/src/ui/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  async viteFinal(baseConfig) {
    baseConfig.base = process.env.STORYBOOK_BASE ?? "/"
    baseConfig.resolve ??= {}

    const existingAlias = baseConfig.resolve.alias
    const normalizedAlias = Array.isArray(existingAlias)
      ? Object.fromEntries(existingAlias.map((a) => [a.find, a.replacement]))
      : { ...existingAlias }

    baseConfig.resolve.alias = {
      ...normalizedAlias,
      "virtual:ardo/search-index": path.resolve(__dirname, "./mocks/search-index.ts"),
    }

    // Add Vanilla Extract plugin
    baseConfig.plugins ??= []
    baseConfig.plugins.push(vanillaExtractPlugin())

    return baseConfig
  },
}

export default config
