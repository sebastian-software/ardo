import { toHtmlWithCodeRenderer } from "ferromark"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getArdoCodeHooks } from "./code-hooks"

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

  it("writes diagram colors that follow the page's color-scheme", async () => {
    const html = await render("```mermaid\nflowchart LR\n  A --> B\n```\n", true)

    expect(html).toContain("light-dark(")
    expect(html).not.toContain("prefers-color-scheme")
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
