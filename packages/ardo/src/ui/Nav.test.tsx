import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoPageProvider } from "../runtime/page"
import { ArdoNavLink } from "./Nav"

describe("ArdoNavLink activeMatch", () => {
  it.each(["/guide", "/guide/installation", "/topic/messages"])(
    "exposes the visible active state to assistive technology at %s",
    (path) => {
      const html = renderToStaticMarkup(
        <ArdoPageProvider base="/project/" path={path}>
          <ArdoNavLink to="/guide" activeMatch="^/topic/">
            Guide
          </ArdoNavLink>
        </ArdoPageProvider>
      )
      expect(html).toContain('aria-current="page"')
      expect(html).toMatch(/class="[^"]* active"/u)
      expect(html).toContain('href="/project/guide/"')
    }
  )

  it.each(["/guidebook", "/topics", "/elsewhere"])(
    "does not mark unrelated pages current at %s",
    (path) => {
      const html = renderToStaticMarkup(
        <ArdoPageProvider path={path}>
          <ArdoNavLink to="/guide" activeMatch="^/topic/">
            Guide
          </ArdoNavLink>
        </ArdoPageProvider>
      )
      expect(html).not.toContain("aria-current")
      expect(html).not.toMatch(/class="[^"]* active"/u)
    }
  )

  it("preserves external links even when their active pattern matches", () => {
    const html = renderToStaticMarkup(
      <ArdoPageProvider path="/topic/messages">
        <ArdoNavLink href="https://example.com" activeMatch="^/topic/">
          Project
        </ArdoNavLink>
      </ArdoPageProvider>
    )
    expect(html).toContain('href="https://example.com"')
    expect(html).not.toContain("aria-current")
  })
})
