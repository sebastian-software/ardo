import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { HeaderLogo } from "./HeaderLogo"

describe("HeaderLogo", () => {
  it("renders both light and dark logo variants", () => {
    const view = renderToStaticMarkup(
      <HeaderLogo logo={{ light: "/logo-light.svg", dark: "/logo-dark.svg" }} alt="Docs" />
    )

    expect(view).toContain('src="/logo-light.svg"')
    expect(view).toContain('src="/logo-dark.svg"')
    expect(view.match(/alt="Docs"/g)).toHaveLength(2)
  })
})
