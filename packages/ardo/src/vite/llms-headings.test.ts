import { describe, expect, it } from "vitest"

import { shiftHeadings } from "./llms-headings"

describe("shiftHeadings", () => {
  it("moves ATX headings down and leaves code and HTML-looking text alone", () => {
    const markdown = [
      "## Two `code`",
      "",
      "```md",
      "## Not a heading",
      "```",
      "",
      "> ### Quoted",
      "",
      "  ## Indented ##",
      "",
      "C# is not a heading marker.",
      "",
      "## Ünïcode",
      "",
    ].join("\n")
    expect(shiftHeadings(markdown, 1)).toBe(
      [
        "### Two `code`",
        "",
        "```md",
        "## Not a heading",
        "```",
        "",
        "> #### Quoted",
        "",
        "  ### Indented ##",
        "",
        "C# is not a heading marker.",
        "",
        "### Ünïcode",
        "",
      ].join("\n")
    )
  })

  it("rewrites setext headings as ATX on one line", () => {
    expect(shiftHeadings("C# guide\n===\n\nSetext *h*\nsecond line\n---\n\nText\n", 1)).toBe(
      "## C# guide\n\n### Setext *h* second line\n\nText\n"
    )
  })

  it("stops at level six", () => {
    expect(shiftHeadings("###### Six\n\n##### Five\n", 1)).toBe("###### Six\n\n###### Five\n")
  })
})
