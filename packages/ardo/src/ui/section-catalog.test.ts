import { describe, expect, it } from "vitest"

import { resolveSectionIcon } from "./section-catalog"
import { resolveSectionKind, resolveSectionLabel } from "./section-kinds"

const rank = (folder: string) => resolveSectionKind(folder)?.rank ?? -1

describe("section catalog", () => {
  it.each([
    ["guide", "guide", "Guide"],
    ["api-reference", "api", "API"],
    ["perf", "performance", "Performance"],
    ["ADR", "decisions", "ADRs"],
    ["release_notes", "changelog", "Changelog"],
  ])("maps the %s folder to the %s kind", (folder, kind, label) => {
    expect(resolveSectionKind(folder)).toMatchObject({ kind, label })
  })

  it("orders kinds by their catalog position", () => {
    expect(rank("guide")).toBeLessThan(rank("api"))
    expect(rank("api")).toBeLessThan(rank("adr"))
    expect(rank("adr")).toBeLessThan(rank("archive"))
  })

  it("never guesses an icon for unknown folders", () => {
    expect(resolveSectionKind("design-notes")).toBeUndefined()
    expect(resolveSectionIcon("design-notes")).toBeUndefined()
    expect(resolveSectionLabel("design-notes")).toBe("Design Notes")
  })
})
