import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Ardo Multiple API Projects Fixture",
  api: [
    {
      entryPoints: ["./packages/alpha/src/index.ts"],
      tsconfig: "./packages/alpha/tsconfig.json",
      out: "api-reference/alpha",
    },
    {
      entryPoints: ["./packages/beta/src/index.ts"],
      tsconfig: "./packages/beta/tsconfig.json",
      out: "api-reference/beta",
    },
  ],
})
