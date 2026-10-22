import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoCodeBlock } from "./CodeBlock"

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
