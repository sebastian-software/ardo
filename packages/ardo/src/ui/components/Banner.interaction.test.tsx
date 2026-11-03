// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ArdoPageBanner } from "./Banner"

const storageKey = "ardo-banner-dismissed:release-7"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ArdoPageBanner dismissal", () => {
  it("shows a labeled close button after mount, hides the banner on click, and remembers it", async () => {
    const user = userEvent.setup()
    render(
      <ArdoPageBanner
        banner={{ content: "Maintenance tonight", dismissible: true, id: "release-7" }}
      />
    )

    const button = screen.getByRole("button", { name: "Dismiss banner" })
    await user.click(button)

    expect(screen.queryByText("Maintenance tonight")).toBeNull()
    expect(localStorage.getItem(storageKey)).toBe("1")
  })

  it("stays hidden on later renders when the id was dismissed before", () => {
    localStorage.setItem(storageKey, "1")

    render(
      <ArdoPageBanner
        banner={{ content: "Maintenance tonight", dismissible: true, id: "release-7" }}
      />
    )

    expect(screen.queryByText("Maintenance tonight")).toBeNull()
  })

  it("does not hide a banner dismissed under a different id", () => {
    localStorage.setItem("ardo-banner-dismissed:other", "1")

    render(
      <ArdoPageBanner
        banner={{ content: "Maintenance tonight", dismissible: true, id: "release-7" }}
      />
    )

    expect(screen.getByText("Maintenance tonight")).toBeTruthy()
  })

  it("renders no close button when the banner is not dismissible", () => {
    render(<ArdoPageBanner banner={{ content: "Read only notice" }} />)

    expect(screen.getByText("Read only notice")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull()
  })

  it("still hides the banner for the current view when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    const user = userEvent.setup()

    render(
      <ArdoPageBanner
        banner={{ content: "Maintenance tonight", dismissible: true, id: "release-7" }}
      />
    )
    expect(screen.getByText("Maintenance tonight")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Dismiss banner" }))
    expect(screen.queryByText("Maintenance tonight")).toBeNull()
  })
})
