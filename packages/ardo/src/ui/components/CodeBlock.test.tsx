import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoCodeBlock } from "./CodeBlock"

describe("ArdoCodeBlock", () => {
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
