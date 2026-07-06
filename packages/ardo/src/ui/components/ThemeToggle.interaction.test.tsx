// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ARDO_THEME_STORAGE_KEY } from "../theme-mode"
import { ArdoThemeToggle } from "./ThemeToggle"

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  vi.stubGlobal("matchMedia", () => ({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn(),
  }))
})

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
})
