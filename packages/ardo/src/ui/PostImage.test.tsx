// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import type { PostImage } from "../publication/types"
import { ArdoProvider } from "../runtime/hooks"
import { ArdoImage } from "./PostImage"

const framed: PostImage = {
  alt: "A subject",
  preset: {
    fallback: "4:3",
    sizes: "100vw",
    sources: [{ media: "(min-width: 60rem)", composition: "16:10" }],
  },
  families: [
    {
      composition: "16:10",
      renditions: [
        { src: "/wide-640.webp", width: 640, height: 400 },
        { src: "/wide-1280.webp", width: 1280, height: 800 },
      ],
    },
    { composition: "4:3", renditions: [{ src: "/compact-640.webp", width: 640, height: 480 }] },
  ],
}

it("keeps crop families separate and declares the dimensions of each selected source", () => {
  const html = renderToStaticMarkup(
    <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
      <ArdoImage image={framed} />
    </ArdoProvider>
  )
  expect(html).toContain('srcSet="/wide-640.webp 640w, /wide-1280.webp 1280w"')
  expect(html).toContain('width="1280" height="800"')
  expect(html).toContain('src="/compact-640.webp" srcSet="/compact-640.webp 640w"')
  expect(html).toContain('alt="A subject"')
})

it("rejects a placement's unavailable crop while preserving unframed source composition", () => {
  const preset = { fallback: "original" as const, sizes: "100vw" }
  expect(() =>
    renderToStaticMarkup(
      <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
        <ArdoImage image={framed} preset={preset} />
      </ArdoProvider>
    )
  ).toThrow("unavailable composition original")
  const original: PostImage = {
    ...framed,
    families: [
      { composition: "original", renditions: [{ src: "/original.webp", width: 120, height: 80 }] },
    ],
  }
  const html = renderToStaticMarkup(
    <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
      <ArdoImage image={original} preset={framed.preset} />
    </ArdoProvider>
  )
  expect(html).toContain('src="/original.webp"')
  expect(html).not.toContain("/compact-")
})

it("selects AVIF resolutions per crop and leaves the single JPEG fallback out of srcset", () => {
  const image: PostImage = {
    ...framed,
    fallback: { src: "/fallback.jpg", width: 1280, height: 960 },
    families: framed.families.map((family) => ({
      ...family,
      renditions: family.renditions.map((rendition) => ({
        ...rendition,
        src: rendition.src.replace(/webp$/u, "avif"),
      })),
    })),
  }
  const html = renderToStaticMarkup(
    <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
      <ArdoImage image={image} sizes="80vw" />
    </ArdoProvider>
  )
  const container = document.createElement("div")
  container.innerHTML = html
  const sources = [...container.querySelectorAll<HTMLSourceElement>("picture > source")]
  expect(sources.map((source) => [source.getAttribute("media"), source.type])).toStrictEqual([
    ["(min-width: 60rem)", "image/avif"],
    [null, "image/avif"],
  ])
  expect(sources[0].srcset).toBe("/wide-640.avif 640w, /wide-1280.avif 1280w")
  expect(sources[1].srcset).toBe("/compact-640.avif 640w")
  expect(sources[1].sizes).toBe("80vw")
  const fallback = container.querySelector("picture > img")
  expect(fallback?.getAttribute("src")).toBe("/fallback.jpg")
  expect(fallback?.hasAttribute("srcset")).toBe(false)
  expect(fallback?.getAttribute("width")).toBe("1280")
  expect(fallback?.getAttribute("height")).toBe("960")
})
