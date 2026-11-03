/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("./Embed.css", () => ({
  embed: "embed",
  frame: "frame",
}))

import { ArdoEmbed } from "./Embed"

describe("ArdoEmbed", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders a lazy iframe with a title, a referrer policy, and no sandbox", () => {
    const view = renderToStaticMarkup(
      <ArdoEmbed src="https://www.youtube-nocookie.com/embed/abc" title="Product tour" />
    )

    expect(view).toContain("<iframe")
    expect(view).toContain('src="https://www.youtube-nocookie.com/embed/abc"')
    expect(view).toContain('title="Product tour"')
    expect(view).toContain('loading="lazy"')
    expect(view).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    expect(view).not.toContain("sandbox")
    expect(view).not.toContain("allow=")
  })

  it("uses a 16 / 9 aspect ratio by default and accepts an override", () => {
    expect(renderToStaticMarkup(<ArdoEmbed src="https://example.com/a" title="A" />)).toContain(
      'style="aspect-ratio:16 / 9"'
    )
    expect(
      renderToStaticMarkup(<ArdoEmbed src="https://example.com/a" title="A" aspectRatio="4 / 3" />)
    ).toContain('style="aspect-ratio:4 / 3"')
  })

  it("passes allow and className through to the rendered elements", () => {
    const view = renderToStaticMarkup(
      <ArdoEmbed
        src="https://example.com/video"
        title="Video"
        allow="fullscreen; picture-in-picture"
        className="demo"
      />
    )

    expect(view).toContain('allow="fullscreen; picture-in-picture"')
    expect(view).toContain('class="embed demo"')
  })

  it.each([
    ["an http URL", "http://example.com/video"],
    ["a protocol-relative URL", "//example.com/video"],
    ["a relative URL", "/videos/tour.mp4"],
    ["an ftp URL", "ftp://example.com/video.mp4"],
    ["a data URL", "data:text/html,<p>hi</p>"],
    ["an empty string", ""],
  ])("renders nothing for %s", (_label, src) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      /* Collect the development warning without printing it. */
    })

    const view = renderToStaticMarkup(<ArdoEmbed src={src} title="Blocked" />)

    expect(view).toBe("")
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain("only renders https: URLs")
  })
})
