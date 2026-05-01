import { configureRule, disableRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })
disableRule(config, "security/detect-non-literal-fs-filename")
disableRule(config, "@typescript-eslint/consistent-type-definitions")
disableRule(config, "@typescript-eslint/no-unsafe-type-assertion")
disableRule(config, "@typescript-eslint/switch-exhaustiveness-check")
disableRule(config, "import/no-extraneous-dependencies")
disableRule(config, "object-shorthand")
disableRule(config, "unicorn/filename-case")
disableRule(config, "react/component-hook-factories")

// JSX conditional rendering inflates complexity counts; raise limits for React components
configureRule(config, "complexity", [20])
configureRule(config, "max-lines-per-function", [{ max: 100 }])

export default config
