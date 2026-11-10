import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterEach, expect, it } from "vitest"
import type { ShareImagesConfig } from "../config/share-images"
import { defaultShareImage, escapeShareImageText } from "./share-image-template"
import { createShareImageRenderer } from "./share-images"

const font = path.resolve(
  import.meta.dirname,
  "../../../../tests/fixtures/share-images/ArdoTestSans.ttf"
)
const directories: string[] = []
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(async (root) => rm(root, { recursive: true, force: true }))
  )
})

async function renderCard(
  title: string,
  options: { render?: ShareImagesConfig["render"]; logo?: string } = {}
) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ardo-card-resource-"))
  directories.push(root)
  if (options.logo != null) await writeFile(path.join(root, "logo.svg"), options.logo)
  const render = createShareImageRenderer({
    root,
    clientDir: root,
    base: "/",
    deploymentBase: "/",
    siteUrl: "",
    siteTitle: "Ardo",
    config: { fonts: [font], fontFamily: "Ardo Test Sans", render: options.render },
  })
  await render({
    routeId: "app/routes/guide/title.md",
    path: "/guide/title",
    publicPath: "/guide/title",
    section: "Guide",
    locale: "en",
    frontmatter: { title },
    appearance: options.logo == null ? {} : { logo: "/logo.svg" },
    meta: [],
  })
  const directory = path.join(root, "assets/share")
  const files = await readdir(directory)
  return sharp(await readFile(path.join(directory, files[0]))).metadata()
}
const svg = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${content}</svg>`

it.each(["The @import rule", "Using url() in CSS"])(
  "renders literal card text in the default template: %s",
  async (title) => {
    expect(await renderCard(title)).toMatchObject({ width: 1200, height: 630, format: "png" })
  }
)
it.each(["The @import rule", "Using url() in CSS"])(
  "renders literal card text in a custom template: %s",
  async (title) => {
    expect(await renderCard(title, { render: defaultShareImage })).toMatchObject({
      width: 1200,
      height: 630,
      format: "png",
    })
  }
)
it.each(["The @import rule", "Using url() in CSS"])(
  "embeds a local SVG logo containing literal text: %s",
  async (title) => {
    expect(
      await renderCard("Logo", {
        logo: svg(`<text x="0" y="40">${escapeShareImageText(title)}</text>`),
      })
    ).toMatchObject({ format: "png" })
  }
)
it.each([
  '<text aria-label="@import url()" data-href="example">Readable text</text>',
  '<!-- <image href="https://example.test/ignored.png"/> @import url() --><rect fill="blue" width="100" height="100"/>',
  '<style>/* @import url() */ rect { fill: blue }</style><rect width="100" height="100"/>',
  '<style>text { font-family: "The @import url() font"; fill: blue }</style><text y="40">Text</text>',
])("keeps text, comments, and CSS strings out of resource checks: %s", async (content) => {
  expect(await renderCard("Text", { render: () => svg(content) })).toMatchObject({ format: "png" })
})
it.each([
  '<style>@import "https://example.test/colors.css";</style>',
  "<style>rect { fill: url(https://example.test/paint.svg#paint) }</style>",
  '<rect style="fill: url(file:///private/image.svg#paint)"/>',
  '<rect fill="url(../outside.svg#paint)"/>',
  '<rect fill="u\\72l(https://example.test/paint.svg#paint)"/>',
])("continues to reject actual external CSS resources: %s", async (content) => {
  await expect(renderCard("External", { render: () => svg(content) })).rejects.toThrow(
    "self-contained"
  )
})
it("continues to reject external resources inside local SVG logos", async () => {
  await expect(
    renderCard("Logo", { logo: svg('<image href="https://example.test/image.png"/>') })
  ).rejects.toThrow("self-contained")
})

it("rejects XLink image resources when the namespace uses a different prefix", async () => {
  await expect(
    renderCard("External", {
      render: () =>
        svg(
          '<image xmlns:asset="http://www.w3.org/1999/xlink" asset:href="https://example.test/image.png"/>'
        ),
    })
  ).rejects.toThrow("self-contained")
})
