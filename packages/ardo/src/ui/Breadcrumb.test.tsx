import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoBreadcrumb } from "./Breadcrumb"

describe("ArdoBreadcrumb", () => {
  it.each(["/rust/configuration", "/rust/configuration/"])(
    "keeps the section and page visible at %s",
    (path) => {
      const view = renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}>
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
        </MemoryRouter>
      )
      expect(view).toContain('aria-label="Breadcrumb"')
      expect(view).toContain("Rust")
      expect(view).toContain("Configuration")
    }
  )
})
