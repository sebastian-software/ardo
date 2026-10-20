import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoOwlMark } from "./OwlMark"

describe("ArdoOwlMark", () => {
  it.each([undefined, ""])(
    "hides the mark from assistive technology when the title is %j",
    (title) => {
      const markup = renderToStaticMarkup(<ArdoOwlMark title={title} />)
      expect(markup).toContain('role="presentation"')
      expect(markup).toContain('aria-hidden="true"')
      expect(markup).not.toContain("<title>")
    }
  )
  it("names the mark as an image when a title is given", () => {
    const markup = renderToStaticMarkup(<ArdoOwlMark title="Ardo" />)
    expect(markup).toContain('role="img"')
    expect(markup).toContain("<title>Ardo</title>")
    expect(markup).not.toContain("aria-hidden")
  })
})
