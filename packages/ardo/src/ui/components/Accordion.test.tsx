import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

describe("ArdoAccordion", () => {
  it("server-renders an accessible closed accordion", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordion title="Details">Accordion content</ArdoAccordion>
    )

    expect(view).toContain('aria-expanded="false"')
    expect(view).toContain('role="region"')
    expect(view).toContain("aria-labelledby=")
  })

  it("keeps collapsed content in the markup for search engines and find-in-page", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordion title="Collapsed">
        <a href="/hidden">Hidden link</a>
      </ArdoAccordion>
    )

    expect(view).toContain("Hidden link")
    expect(view).toContain("hidden=")
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
    expect(view).toContain("data-open")
    expect(view).toContain('aria-controls="')
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

  it("server-renders every default-open item in a multi-open group", () => {
    const view = renderToStaticMarkup(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First" defaultOpen>
          First panel
        </ArdoAccordion>
        <ArdoAccordion title="Second" defaultOpen>
          Second panel
        </ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const openCount = view.match(/aria-expanded="true"/g)?.length ?? 0
    expect(openCount).toBe(2)
  })
})
