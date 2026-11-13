import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoCodeBlock, ArdoCodeGroup } from "./CodeBlock"

describe("ArdoCodeBlock", () => {
  it("makes plain and native highlighted code keyboard focusable", () => {
    const plain = renderToStaticMarkup(<ArdoCodeBlock>const x = 1</ArdoCodeBlock>)
    const highlighted = renderToStaticMarkup(
      <ArdoCodeBlock>
        <pre className="shiki">
          <code>const x = 1</code>
        </pre>
      </ArdoCodeBlock>
    )
    expect(plain).toContain('tabindex="0"')
    expect(highlighted).toContain('class="shiki" tabindex="0"')
  })

  it("marks a block that wraps long lines", () => {
    expect(renderToStaticMarkup(<ArdoCodeBlock wrap>Set up Ardo.</ArdoCodeBlock>)).toContain(
      'data-wrap=""'
    )
    expect(
      renderToStaticMarkup(<ArdoCodeBlock language="prompt">Set up Ardo.</ArdoCodeBlock>)
    ).toContain('data-wrap=""')
    expect(renderToStaticMarkup(<ArdoCodeBlock>const x = 1</ArdoCodeBlock>)).not.toContain(
      "data-wrap"
    )
  })
})

describe("ArdoCodeGroup", () => {
  it("prerenders a tablist whose tabs control every panel", () => {
    const view = renderToString(
      <ArdoCodeGroup labels=" npm , pnpm">
        <ArdoCodeBlock language="bash" code="npm install ardo" />
        <ArdoCodeBlock language="bash" code="pnpm add ardo" />
      </ArdoCodeGroup>
    )

    expect(view).toContain('role="tablist"')
    expect(view).toMatch(/role="tab"[^>]*aria-selected="true" tabindex="0"[^>]*>npm<\/button>/u)
    expect(view).toMatch(/role="tab"[^>]*aria-selected="false" tabindex="-1"[^>]*>pnpm<\/button>/u)
    const tabControlIds = [...view.matchAll(/aria-controls="([^"]+)"/gu)].map((match) => match[1])
    const panelIds = [...view.matchAll(/role="tabpanel" id="([^"]+)"/gu)].map((match) => match[1])
    expect(tabControlIds).toHaveLength(2)
    expect(panelIds).toStrictEqual(tabControlIds)
    expect(view).toContain("npm install ardo")
    expect(view).toContain("pnpm add ardo")
    expect(view.match(/hidden=""/gu)).toHaveLength(1)
  })
})
