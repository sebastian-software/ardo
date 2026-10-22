// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoRoutePathsContext } from "../runtime/route-paths"
import { ArdoLocaleSwitcher } from "./site-controls"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("locale navigation", () => {
  it.each(["/project/", "/project/v6/"])("preserves base %s, query and hash", (base) => {
    const assign = vi.fn()
    vi.stubGlobal("location", { assign, search: "?q=typed%20links", hash: "#details" })
    render(
      <ArdoRoutePathsContext value={new Set(["/en/guide/release-6.0", "/de/guide/release-6.0"])}>
        <ArdoPageProvider base={base} path="/en/guide/release-6.0">
          <ArdoProvider
            sidebar={[]}
            config={{
              title: "Docs",
              i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
            }}
          >
            <ArdoLocaleSwitcher />
          </ArdoProvider>
        </ArdoPageProvider>
      </ArdoRoutePathsContext>
    )
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "de" } })
    expect(assign).toHaveBeenCalledExactlyOnceWith(
      `${base}de/guide/release-6.0/?q=typed%20links#details`
    )
  })
})
