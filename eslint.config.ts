import { configureRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })

config.push({
  files: ["**/*.stories.tsx"],
  rules: {
    "import/no-extraneous-dependencies": "off",
  },
})

// The CLI and config/server harnesses run in Node.js.
config.push({
  files: [
    "packages/ardo/src/cli/**/*.ts",
    "packages/ardo/src/vite/managed-runtime-plugin.test.ts",
    "packages/ardo/src/vite/project-config.test.ts",
  ],
  rules: { "compat/compat": "off" },
})

// JSX conditional rendering inflates complexity counts; raise limits for React components
configureRule(config, "complexity", [20])
configureRule(config, "max-lines-per-function", [{ max: 100 }])

export default config
