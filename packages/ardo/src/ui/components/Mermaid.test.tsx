import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoMermaid } from "./Mermaid"

describe("ArdoMermaid native code component", () => {
  it("renders native string children as the diagram source during SSR", () => {
    const source = "graph TD\n  A --> B\n"
    const view = renderToStaticMarkup(createElement(ArdoMermaid, {}, source))

    expect(view).toContain("graph TD\n  A --&gt; B\n")
    expect(view).toContain('data-state="pending"')
  })

  it.each(["explicit source", ""])("keeps code %j ahead of children", (code) => {
    const view = renderToStaticMarkup(createElement(ArdoMermaid, { code }, "child source"))

    expect(view).toContain(`<code>${code}</code>`)
    expect(view).not.toContain("child source")
  })
})
