// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useMDXComponents } from "./provider"

afterEach(() => {
  cleanup()
})

function Links() {
  const { a: Link } = useMDXComponents()
  return (
    <>
      <Link href="https://example.com">external</Link>
      <Link href="http-api">relative http</Link>
    </>
  )
}

describe("MDX links", () => {
  it("opens only real URLs in a new tab", () => {
    render(<Links />)

    const external = screen.getByText("external")
    const relative = screen.getByText("relative http")

    expect(external.getAttribute("target")).toBe("_blank")
    expect(relative.getAttribute("href")).toBe("/http-api/")
    expect(relative.hasAttribute("target")).toBe(false)
  })
})
