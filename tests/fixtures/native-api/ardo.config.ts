import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Ardo Native API Fixture",
  githubPages: false,
  api: { entryPoints: ["./src/index.ts"], tsconfig: "./tsconfig.api.json" },
})
