import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoHero } from "./Hero"

describe("ArdoHero images", () => {
  it("prerenders both theme variants without needing client state", () => {
    const html = renderToStaticMarkup(
      <ArdoHero image={{ light: "/light.svg", dark: "/dark.svg", alt: "Project preview" }} />
    )
    expect(html).toContain('src="/light.svg"')
    expect(html).toContain('src="/dark.svg"')
    expect(html.match(/<img /g)).toHaveLength(2)
  })

  it.each(["/light.svg", { light: "/light.svg" }, { light: "/light.svg", dark: "" }])(
    "keeps one image available in both themes without a dark variant: %j",
    (image) => {
      const html = renderToStaticMarkup(<ArdoHero name="Project" image={image} />)
      expect(html).toContain('src="/light.svg" alt="Project"')
      expect(html.match(/<img /g)).toHaveLength(1)
    }
  )

  it("keeps inline React illustrations", () => {
    const html = renderToStaticMarkup(<ArdoHero image={<svg aria-label="Project mark" />} />)
    expect(html).toContain('<svg aria-label="Project mark"')
    expect(html).not.toContain("<img ")
  })
})
