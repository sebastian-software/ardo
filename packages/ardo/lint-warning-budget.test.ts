import { describe, expect, it } from "vitest"
import { auditLintResults, ruleName } from "../../scripts/check-lint-budget.mjs"

const warning = (code: string) => ({ severity: "warning", code })
const error = (code: string) => ({ severity: "error", code })

describe("lint warning budgets", () => {
  it("accepts a known category within its ceiling", () => {
    expect(auditLintResults([warning("react(known)")], { "react/known": 1 }).passed).toBe(true)
  })
  it("rejects a new category even if another category has unused budget", () => {
    const audit = auditLintResults([warning("react(new)")], { "react/known": 10 })
    expect(audit.passed).toBe(false)
    expect([...audit.exceeded]).toStrictEqual(["react/new"])
  })
  it("rejects a category above its own ceiling", () => {
    expect(
      auditLintResults([warning("react(known)"), warning("react(known)")], { "react/known": 1 })
        .passed
    ).toBe(false)
  })
  it("rejects every lint error regardless of warning budget", () => {
    expect(auditLintResults([error("react(known)")], { "react/known": 100 }).passed).toBe(false)
  })
  it("names oxlint rules the way the budget file does", () => {
    expect(ruleName("vitest(no-conditional-in-test)")).toBe("vitest/no-conditional-in-test")
    expect(ruleName("eslint(complexity)")).toBe("complexity")
    expect(ruleName(undefined)).toBe("unknown")
  })
})
