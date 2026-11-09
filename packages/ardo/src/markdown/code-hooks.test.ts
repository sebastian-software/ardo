import { toHtmlWithCodeRenderer } from "ferromark"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getArdoCodeHooks, scopeDarkRules } from "./code-hooks"

afterEach(() => {
  vi.restoreAllMocks()
})

async function render(source: string, mermaid: boolean) {
  const hooks = await getArdoCodeHooks(
    { mermaid },
    { languages: ["mermaid", "ts"], source, sourcePath: "guide/diagrams.md" }
  )
  return toHtmlWithCodeRenderer(source, hooks)
}

describe("Ardo code hooks", () => {
  it("renders Mermaid fences to static SVG when markdown.mermaid is on", async () => {
    const html = await render("```mermaid\nflowchart LR\n  A --> B\n```\n", true)

    expect(html).toContain("<svg")
    expect(html).toContain('id="fm-mermaid-0"')
    expect(html).not.toContain("<script")
  })

  it("keeps Mermaid fences as code when markdown.mermaid is off", async () => {
    const html = await render("```mermaid\nflowchart LR\n  A --> B\n```\n", false)

    expect(html).not.toContain("<svg")
    expect(html).toContain("flowchart LR")
  })

  it("follows Ardo's dark and light classes and keeps the system fallback", async () => {
    const html = await render("```mermaid\nflowchart LR\n  A --> B\n```\n", true)

    expect(html).toContain(":root.dark #fm-mermaid-0{")
    expect(html).toContain("@media (prefers-color-scheme: dark){:root:not(.light) #fm-mermaid-0{")
  })

  it("keeps an invalid diagram as code and names its file and line", async () => {
    const warn = vi.spyOn(console, "warn").mockReturnValue(undefined)
    const html = await render(
      "# Diagrams\n\nText.\n\n```mermaid\nflowchart LR\n  A[unterminated\n```\n",
      true
    )

    expect(html).not.toContain("<svg")
    expect(html).toContain("A[unterminated")
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("guide/diagrams.md:5"),
      expect.anything()
    )
  })

  it("highlights other fences next to diagrams", async () => {
    const html = await render(
      "```ts\nconst answer = 42\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```\n",
      true
    )

    expect(html).toContain("--shiki-light")
    expect(html).toContain("<svg")
  })
})

describe("scopeDarkRules", () => {
  it("scopes every dark rule to Ardo's classes", () => {
    const svg =
      "<svg><style>#d{--c:#000;}@media (prefers-color-scheme: dark){#d{--c:#fff;}#d .a,#d .b{fill:red;}}#d .x{fill:var(--c);}</style></svg>"

    expect(scopeDarkRules(svg)).toBe(
      "<svg><style>#d{--c:#000;}" +
        ":root.dark #d{--c:#fff;}:root.dark #d .a,:root.dark #d .b{fill:red;}" +
        "@media (prefers-color-scheme: dark){:root:not(.light) #d{--c:#fff;}:root:not(.light) #d .a,:root:not(.light) #d .b{fill:red;}}" +
        "#d .x{fill:var(--c);}</style></svg>"
    )
  })

  it("leaves SVG without dark rules unchanged", () => {
    const svg = "<svg><style>#d{fill:red;}</style></svg>"

    expect(scopeDarkRules(svg)).toBe(svg)
  })
})
