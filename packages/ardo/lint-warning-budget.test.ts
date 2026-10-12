import { describe, expect, it } from "vitest"
import { auditLintResults } from "../../scripts/check-lint-budget.mjs"

const results = (messages: Array<{ severity: number; ruleId: string }>) => [{ messages }]

describe("lint warning budgets", () => {
  it("accepts a known category within its ceiling", () => {
    expect(auditLintResults(results([{ severity: 1, ruleId: "known" }]), { known: 1 }).passed).toBe(
      true
    )
  })
  it("rejects a new category even if another category has unused budget", () => {
    const audit = auditLintResults(results([{ severity: 1, ruleId: "new" }]), { known: 10 })
    expect(audit.passed).toBe(false)
    expect([...audit.exceeded]).toStrictEqual(["new"])
  })
  it("rejects a category above its own ceiling", () => {
    expect(
      auditLintResults(
        results([
          { severity: 1, ruleId: "known" },
          { severity: 1, ruleId: "known" },
        ]),
        { known: 1 }
      ).passed
    ).toBe(false)
  })
  it("rejects every lint error regardless of warning budget", () => {
    expect(
      auditLintResults(results([{ severity: 2, ruleId: "known" }]), { known: 100 }).passed
    ).toBe(false)
  })
})
