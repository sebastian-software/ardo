import { configureRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })

// JSX conditional rendering inflates complexity counts; raise limits for React components
configureRule(config, "complexity", [20])
configureRule(config, "max-lines-per-function", [{ max: 100 }])

export default config
