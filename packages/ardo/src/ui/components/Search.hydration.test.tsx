// @vitest-environment jsdom

import { act } from "@testing-library/react"
import { createElement } from "react"
import { hydrateRoot, type Root } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoPageProvider } from "../../runtime/page"
import { ArdoHeaderSearch } from "./HeaderSearch"

let root: Root | undefined

afterEach(() => {
  act(() => root?.unmount())
  root = undefined
  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

function stubPlatform(platform: string) {
  vi.spyOn(navigator, "platform", "get").mockReturnValue(platform)
}

function hydrateHeaderSearch(serverPlatform: string, clientPlatform: string) {
  const tree = createElement(ArdoPageProvider, null, createElement(ArdoHeaderSearch))
  stubPlatform(serverPlatform)
  const container = document.createElement("div")
  container.innerHTML = renderToString(tree)
  document.body.append(container)
  stubPlatform(clientPlatform)
  act(() => {
    root = hydrateRoot(container, tree, { onRecoverableError: () => {} })
  })
  return [...container.querySelectorAll("kbd")].map((kbd) => kbd.textContent)
}

describe("search shortcut hint after hydration", () => {
  it("switches the server's ⌘ to Ctrl on Windows and Linux", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(hydrateHeaderSearch("MacIntel", "Win32")).toStrictEqual(["Ctrl", "K", "Ctrl", "K"])
    expect(errors).not.toHaveBeenCalled()
  })

  it("keeps ⌘ on Apple platforms", () => {
    expect(hydrateHeaderSearch("MacIntel", "MacIntel")).toStrictEqual(["⌘", "K", "⌘", "K"])
  })
})
