import { describe, expect, it } from "vitest"
import { defineArdoConfig } from "./project"
import { validateArdoOptionNames } from "./plugin-options"

// These calls are checked by the package typecheck, without executing invalid config.
function checkConfigTypes() {
  // @ts-expect-error Unknown top-level options must not be accepted.
  defineArdoConfig({ title: "Docs", siteurl: "https://docs.example.com" })
  // @ts-expect-error Nested options must retain contextual type checking.
  defineArdoConfig({ title: "Docs", linkCheck: { level: "errors" } })
  // @ts-expect-error Nested option spelling must be checked as well.
  defineArdoConfig({ title: "Docs", brand: { clor: "green" } })
  defineArdoConfig({ title: "Docs", base: "/docs/", linkCheck: { level: "error" } })
  defineArdoConfig((environment) => ({ base: environment.command === "build" ? "/docs/" : "/" }))
  defineArdoConfig(async (environment) => ({
    base: environment.command === "build" ? "/docs/" : "/",
  }))
  defineArdoConfig(Promise.resolve({ base: "/docs/" }))
}
void checkConfigTypes

describe("Ardo configuration option names", () => {
  it("reports computed or JavaScript config typos with the correct spelling", () => {
    const config = { title: "Docs", siteurl: "https://docs.example.com" }
    expect(() => validateArdoOptionNames(config)).toThrow('Did you mean "siteUrl"?')
    const linkConfig = { title: "Docs", linkcheck: {} }
    expect(() => validateArdoOptionNames(linkConfig)).toThrow('Did you mean "linkCheck"?')
  })

  it("accepts current configuration options", () => {
    expect(() =>
      validateArdoOptionNames({ base: "/docs/", linkCheck: { level: "error" }, api: true })
    ).not.toThrow()
  })
})
