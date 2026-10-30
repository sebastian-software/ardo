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
