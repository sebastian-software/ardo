import { disableRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })
disableRule(config, "security/detect-non-literal-fs-filename")

export default config
