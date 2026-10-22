import { describe, expect, it } from "vitest"
import { defineArdoConfig } from "./project"
import { validateArdoOptionNames } from "./plugin-options"

// These calls are checked by the package typecheck, without executing invalid config.
function checkConfigTypes() {
  // @ts-expect-error Unknown top-level options must not be accepted.
  defineArdoConfig({ title: "Docs", githubpages: false })
  // @ts-expect-error Nested options must retain contextual type checking.
  defineArdoConfig({ title: "Docs", linkCheck: { level: "errors" } })
  // @ts-expect-error Nested option spelling must be checked as well.
  defineArdoConfig({ title: "Docs", brand: { clor: "green" } })
  defineArdoConfig({ title: "Docs", githubPages: false, linkCheck: { level: "error" } })
  defineArdoConfig((environment) => ({ githubPages: environment.command === "build" }))
  defineArdoConfig(async (environment) => ({ githubPages: environment.command === "build" }))
  defineArdoConfig(Promise.resolve({ githubPages: false }))
}
void checkConfigTypes

describe("Ardo configuration option names", () => {
  it("reports computed or JavaScript config typos with the correct spelling", () => {
    const config = { title: "Docs", githubpages: false }
    expect(() => validateArdoOptionNames(config)).toThrow('Did you mean "githubPages"?')
    const linkConfig = { title: "Docs", linkcheck: {} }
    expect(() => validateArdoOptionNames(linkConfig)).toThrow('Did you mean "linkCheck"?')
  })

  it("accepts current configuration options", () => {
    expect(() =>
      validateArdoOptionNames({ githubPages: false, linkCheck: { level: "error" }, api: true })
    ).not.toThrow()
  })
})
