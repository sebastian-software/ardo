// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ARDO_THEME_STORAGE_KEY } from "../theme-mode"
import { ArdoThemeToggle } from "./ThemeToggle"

const systemScheme = { dark: false, listeners: new Set<() => void>() }

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  systemScheme.dark = false
  systemScheme.listeners.clear()
  vi.stubGlobal("matchMedia", () => ({
    addEventListener: (_type: string, listener: () => void) => systemScheme.listeners.add(listener),
    get matches() {
      return systemScheme.dark
    },
    removeEventListener: (_type: string, listener: () => void) =>
      systemScheme.listeners.delete(listener),
  }))
})

afterEach(() => {
  cleanup()
})

function renderHeaderAndDrawerToggles() {
  render(
    <>
      <header>
        <ArdoThemeToggle />
      </header>
      <nav>
        <ArdoThemeToggle />
      </nav>
    </>
  )
  const [header, drawer] = screen.getAllByRole("button")
  return { header, drawer }
}

describe("ArdoThemeToggle interactions", () => {
  it("cycles theme modes, applies root classes, and persists the selection", async () => {
    const user = userEvent.setup()
    render(<ArdoThemeToggle />)

    const button = screen.getByRole("button", { name: "Switch to light theme" })

    await user.click(button)
    expect(localStorage.getItem(ARDO_THEME_STORAGE_KEY)).toBe("light")
    expect(document.documentElement.classList.contains("light")).toBe(true)

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }))
    expect(localStorage.getItem(ARDO_THEME_STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    await user.click(screen.getByRole("button", { name: "Switch to system theme" }))
    expect(localStorage.getItem(ARDO_THEME_STORAGE_KEY)).toBe("system")
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("keeps every toggle on the page in sync with the chosen theme", async () => {
    const user = userEvent.setup()
    const { header, drawer } = renderHeaderAndDrawerToggles()

    await user.click(drawer)

    expect(header.getAttribute("aria-label")).toBe("Switch to dark theme")
    expect(drawer.getAttribute("aria-label")).toBe("Switch to dark theme")
  })

  it("keeps an explicit choice when the system color scheme changes", async () => {
    const user = userEvent.setup()
    const { drawer } = renderHeaderAndDrawerToggles()

    await user.click(drawer)
    systemScheme.dark = true
    act(() => {
      for (const listener of systemScheme.listeners) listener()
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("follows a theme chosen in another tab", () => {
    const { header } = renderHeaderAndDrawerToggles()

    localStorage.setItem(ARDO_THEME_STORAGE_KEY, "dark")
    act(() => {
      globalThis.dispatchEvent(new StorageEvent("storage", { key: ARDO_THEME_STORAGE_KEY }))
    })

    expect(header.getAttribute("aria-label")).toBe("Switch to system theme")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
