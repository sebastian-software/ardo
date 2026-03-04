import type { StorybookConfig } from "@storybook/react-vite"
import path from "node:path"

const config: StorybookConfig = {
  stories: ["../packages/ardo/src/ui/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
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

    return baseConfig
  },
}

export default config
