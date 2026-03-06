import { configureRule, disableRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })
disableRule(config, "security/detect-non-literal-fs-filename")

// JSX conditional rendering inflates complexity counts; raise limits for React components
configureRule(config, "complexity", [20])
configureRule(config, "max-lines-per-function", [{ max: 100 }])

export default config
