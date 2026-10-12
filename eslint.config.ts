import { configureRule, getEslintConfig } from "eslint-config-setup"

const config = await getEslintConfig({ react: true })

config.push({
  files: ["**/*.stories.tsx"],
  rules: {
    "import/no-extraneous-dependencies": "off",
  },
})

// JSX conditional rendering inflates complexity counts; raise limits for React components
configureRule(config, "complexity", [20])
configureRule(config, "max-lines-per-function", [{ max: 100 }])

configureRule(config, "@cspell/spellchecker", [
  {
    checkComments: true,
    checkIdentifiers: true,
    checkStrings: false,
    cspell: {
      words: ["Ardo", "Ferriki", "Ferromark", "Mintlify", "lede", "prepass", "unlocalized", "apos"],
    },
  },
])

export default config
