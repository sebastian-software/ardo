// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoPageActions } from "./PageActions"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("page actions", () => {
  it("links to the Markdown file and fetches nothing until Copy page is clicked", () => {
    const fetch = vi.spyOn(globalThis, "fetch")
    render(<ArdoPageActions markdownPath="/docs/guide/start.md" />)

    const link = screen.getByRole("link", { name: "View as Markdown" })
    expect(link.getAttribute("href")).toBe("/docs/guide/start.md")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("fetches the Markdown file on click and copies its text", async () => {
    const user = userEvent.setup()
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("# Start\n\nWelcome.\n", { status: 200 }))
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<ArdoPageActions markdownPath="/docs/guide/start.md" />)

    await user.click(screen.getByRole("button", { name: "Copy page" }))

    expect(fetch).toHaveBeenCalledWith("/docs/guide/start.md")
    expect(writeText).toHaveBeenCalledWith("# Start\n\nWelcome.\n")
    expect(await screen.findByRole("button", { name: "Copied!" })).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("")
  })

  it("shows the copy-failed message when the Markdown file cannot be fetched", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"))
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<ArdoPageActions markdownPath="/docs/guide/start.md" />)

    await user.click(screen.getByRole("button", { name: "Copy page" }))

    expect(
      await screen.findByText("Copying failed. Open the Markdown version instead.")
    ).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe(
      "Copying failed. Open the Markdown version instead."
    )
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Copy page" })).toBeTruthy()
  })

  it("treats a missing Markdown file as a failed copy", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 404 }))
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<ArdoPageActions markdownPath="/docs/guide/missing.md" />)

    await user.click(screen.getByRole("button", { name: "Copy page" }))

    expect(
      await screen.findByText("Copying failed. Open the Markdown version instead.")
    ).toBeTruthy()
    expect(writeText).not.toHaveBeenCalled()
  })

  it("shows the copy-failed message when the clipboard refuses the text", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("# Start", { status: 200 }))
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("Denied", "NotAllowedError")
    )
    render(<ArdoPageActions markdownPath="/docs/guide/start.md" />)

    await user.click(screen.getByRole("button", { name: "Copy page" }))

    expect(
      await screen.findByText("Copying failed. Open the Markdown version instead.")
    ).toBeTruthy()
  })
})
