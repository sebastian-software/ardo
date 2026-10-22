import { getOxlintConfig } from "eslint-config-setup"
import { defineConfig, type OxlintConfig } from "oxlint"

// eslint-disable-next-line typescript/no-unsafe-type-assertion -- getOxlintConfig() is not yet typed against oxlint's own OxlintConfig
const config = getOxlintConfig({ react: true }) as OxlintConfig

config.ignorePatterns = ["**/dist/**", "**/build/**", "coverage/**", "node_modules/**"]

// JSX conditional rendering inflates complexity counts; raise limits for React components.
config.rules = {
  ...config.rules,
  complexity: ["error", 20],
  "max-lines-per-function": ["error", { max: 100 }],
}

// ESLint never checked conditionals in tests; keep the existing ones as a
// budgeted warning (scripts/lint-warning-budget.json) so the count only drops.
for (const override of config.overrides ?? []) {
  if (override.rules?.["vitest/no-conditional-in-test"] != null) {
    override.rules["vitest/no-conditional-in-test"] = "warn"
  }
}

export default defineConfig(config)
