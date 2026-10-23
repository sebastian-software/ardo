import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Ardo Native API Fixture",
  api: { entryPoints: ["./src/index.ts"], tsconfig: "./tsconfig.api.json" },
})
