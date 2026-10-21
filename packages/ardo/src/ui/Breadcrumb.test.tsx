import { renderToStaticMarkup } from "react-dom/server"
import { ArdoPageProvider } from "../runtime/page"
import { describe, expect, it } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoBreadcrumb } from "./Breadcrumb"

describe("ArdoBreadcrumb", () => {
  it.each(["/rust/configuration", "/rust/configuration/"])(
    "keeps the section and page visible at %s",
    (path) => {
      const view = renderToStaticMarkup(
        <ArdoPageProvider path={path}>
          <ArdoProvider
            config={{ title: "Docs" }}
            sidebar={[
              {
                text: "Rust",
                items: [{ text: "Configuration", link: "/rust/configuration/" }],
              },
            ]}
          >
            <ArdoBreadcrumb />
          </ArdoProvider>
        </ArdoPageProvider>
      )
      expect(view).toContain('aria-label="Breadcrumb"')
      expect(view).toContain("Rust")
      expect(view).toContain("Configuration")
    }
  )
})
