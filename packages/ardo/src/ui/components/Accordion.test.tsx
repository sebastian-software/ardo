import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

describe("ArdoAccordion", () => {
  it("connects trigger and region IDs in server-rendered markup", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordion title="Details">Accordion content</ArdoAccordion>
    )
    const trigger =
      /<button[^>]*id="([^"]+)"[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"/.exec(view)

    expect(trigger).not.toBeNull()
    expect(view).toContain(`id="${trigger?.[2]}"`)
    expect(view).toContain(`aria-labelledby="${trigger?.[1]}"`)
    expect(view).toContain('role="region"')
  })

  it("removes collapsed content from focus and accessibility navigation", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordion title="Collapsed">
        <a href="/hidden">Hidden link</a>
      </ArdoAccordion>
    )

    expect(view).toContain('aria-hidden="true"')
    expect(view).toContain("inert")
  })

  it("server-renders a default-open item inside an only-one-open group", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordionGroup onlyOneOpen>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <ArdoAccordion title="Second" defaultOpen>
          Second panel
        </ArdoAccordion>
      </ArdoAccordionGroup>
    )

    expect(view).toContain('aria-expanded="true"')
    expect(view).toContain('data-open="true"')
    expect(view).toContain('aria-hidden="false"')
  })

  it("renders a configurable heading level", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordion title="Nested" headingLevel={4}>
        Nested content
      </ArdoAccordion>
    )

    expect(view).toContain("<h4")
    expect(view).toContain("</h4>")
  })
})
