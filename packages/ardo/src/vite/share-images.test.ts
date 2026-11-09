import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterEach, describe, expect, it } from "vitest"
import { validateShareImagesConfig } from "../config/share-images"
import type { ArdoRenderOptions } from "../entries/server"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import { createShareImageRenderer } from "./share-images"
import { defaultShareImage } from "./share-image-template"

const font = path.resolve(
  import.meta.dirname,
  "../../../../tests/fixtures/share-images/ArdoTestSans.ttf"
)
const dirs: string[] = []
afterEach(async () => {
  await Promise.all(dirs.splice(0).map(async (dir) => rm(dir, { recursive: true, force: true })))
})

async function setup(
  config: Parameters<typeof createShareImageRenderer>[0]["config"] = {
    fonts: [font],
    fontFamily: "Ardo Test Sans",
  }
) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ardo-share-"))
  dirs.push(root)
  const clientDir = path.join(root, "client")
  return {
    root,
    clientDir,
    render: createShareImageRenderer({
      config,
      root,
      clientDir,
      base: "/project/v6/",
      deploymentBase: "/project/",
      siteUrl: "https://example.test",
      siteTitle: "Ardo",
    }),
  }
}
function page(
  overrides: Partial<Parameters<NonNullable<ArdoRenderOptions["shareImage"]>>[0]> = {}
) {
  return {
    routeId: "/project/app/routes/en/guide/intro.mdx",
    frontmatter: { title: "Getting started" },
    path: "/en/guide/intro",
    publicPath: "/project/v6/en/guide/intro",
    section: "guide",
    locale: "en",
    appearance: {},
    meta: [] as ArdoMetaDescriptor[],
    ...overrides,
  }
}
async function png(client: string): Promise<Buffer> {
  const dir = path.join(client, "v6/assets/share")
  const files = await readdir(dir)
  return readFile(path.join(dir, files[0]))
}

describe("build-time share cards", () => {
  it("emits a real 1200 × 630 PNG under the version base and replaces site-level image defaults", async () => {
    const { render, clientDir } = await setup()
    const meta = await render(
      page({
        meta: [
          { property: "og:image", content: "https://example.test/default.png" },
          { name: "twitter:image", content: "https://example.test/default.png" },
        ],
      })
    )
    const rendered = await sharp(await png(clientDir)).metadata()
    expect(rendered).toMatchObject({
      width: 1200,
      height: 630,
      format: "png",
    })
    expect(meta).toStrictEqual(
      expect.arrayContaining([
        {
          property: "og:image",
          content: expect.stringMatching(
            /^https:\/\/example\.test\/project\/v6\/assets\/share\/[a-f0-9]+\.png$/u
          ),
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Getting started" },
        { name: "twitter:card", content: "summary_large_image" },
      ])
    )
    expect(meta).not.toStrictEqual(
      expect.arrayContaining([
        { property: "og:image", content: "https://example.test/default.png" },
      ])
    )
  })

  it("does not load invalid fonts or call a template for explicit ogImage overrides and TSX routes", async () => {
    const { render } = await setup({
      fonts: ["does-not-exist.ttf"],
      fontFamily: "Missing",
      render() {
        throw new Error("must not render")
      },
    })
    expect(
      await render(page({ frontmatter: { title: "Manual", ogImage: "/manual.png" } }))
    ).toBeUndefined()
    expect(await render(page({ routeId: "/project/home.tsx" }))).toBeUndefined()
  })

  it("preserves an explicit Twitter image even without an existing og:image", async () => {
    const { render } = await setup()
    const meta = await render(
      page({
        frontmatter: { title: "Own Twitter image", twitterImage: "/twitter.png" },
        meta: [{ name: "twitter:image", content: "https://example.test/twitter.png" }],
      })
    )
    expect(meta).toContainEqual({
      name: "twitter:image",
      content: "https://example.test/twitter.png",
    })
    expect(countMeta(meta, "twitter:image")).toBe(1)
  })

  it("passes localized title, section, public identity, embedded local logo, and per-page theme into a custom template", async () => {
    const inputs: Array<Parameters<typeof defaultShareImage>[0]> = []
    const { root, render, clientDir } = await setup({
      fonts: [font],
      fontFamily: "Ardo Test Sans",
      render(input) {
        inputs.push(input)
        return defaultShareImage(input)
      },
    })
    await mkdir(path.join(clientDir, "v6/assets"), { recursive: true })
    await writeFile(
      path.join(clientDir, "v6/assets/logo.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="15" fill="green"/></svg>'
    )
    await render(
      page({
        frontmatter: { title: "Einführung & Überblick" },
        locale: "de",
        path: "/de/guide/start",
        publicPath: "/project/v6/de/guide/start/",
        appearance: {
          logo: "/project/v6/assets/logo.svg",
          themeCss: ":root{--ardo-hue-brand:240;}",
        },
        meta: [
          {
            tagName: "link",
            rel: "canonical",
            href: "https://example.test/project/v6/de/guide/start/",
          },
        ],
      })
    )
    await render(page({ appearance: { themeCss: ":root{--ardo-hue-brand:25;}" } }))
    expect(inputs[0]).toMatchObject({
      title: "Einführung & Überblick",
      section: "guide",
      locale: "de",
      path: "/project/v6/de/guide/start/",
      logo: expect.stringMatching(/^data:image\/svg\+xml;base64,/u),
    })
    expect(inputs[0].colors.brand).not.toBe(inputs[1].colors.brand)
    expect(inputs[1].logo).toBeUndefined()
    expect(root).toBeTruthy()
  })

  it.each(["url(#fade)", "url( #fade )", 'url("#fade")', "url('#fade')"])(
    "supports self-contained template gradients: %s",
    async (fill) => {
      const { render } = await setup({
        fonts: [font],
        fontFamily: "Ardo Test Sans",
        render: () =>
          `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="fade"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><rect width="1200" height="630" style='fill:${fill.replaceAll("'", "&apos;")}'/></svg>`,
      })
      expect(await render(page())).toBeDefined()
    }
  )

  it("lets a custom renderer bypass computed CSS color overrides", async () => {
    const { render } = await setup({
      fonts: [font],
      fontFamily: "Ardo Test Sans",
      render: () =>
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="black"/></svg>',
    })
    await expect(
      render(page({ appearance: { themeCss: ":root{--ardo-color-bg:var(--site-bg);}" } }))
    ).resolves.toBeDefined()
  })

  it.each(["https://example.test/a.png", "file:///etc/passwd", "../outside.png"])(
    "rejects a custom template external image: %s",
    async (href) => {
      const { render } = await setup({
        fonts: [font],
        fontFamily: "Ardo Test Sans",
        render: () => `<svg width="1200" height="630"><image href="${href}"/></svg>`,
      })
      await expect(render(page())).rejects.toThrow("self-contained")
    }
  )

  it.each([
    "Getting started",
    "Einführung & Überblick",
    "Référence française",
    "Guía de instalación",
    "日本語指南",
    "Ελληνικά",
    "Русский",
  ])("renders visible glyphs for %s from explicitly supplied fonts", async (title) => {
    const { render, clientDir } = await setup()
    await render(page({ frontmatter: { title } }))
    const { data, info } = await sharp(await png(clientDir))
      .extract({ left: 70, top: 225, width: 1000, height: 100 })
      .raw()
      .toBuffer({ resolveWithObject: true })
    // Dark title pixels in the title region prove a font was loaded, not just a blank PNG.
    const dark = countDarkPixels(data, info.channels)
    expect(dark).toBeGreaterThan(400)
  })

  it.each([
    "C:\\fonts\\MySans.ttf",
    "D:/assets/MySans.otf",
    "/fonts/MySans.ttf",
    "app/fonts/MySans.ttf",
  ])("accepts explicit local font path %s", (file) => {
    expect(() => validateShareImagesConfig({ fonts: [file], fontFamily: "My Sans" })).not.toThrow()
  })

  it("falls back to a route filename when no title or heading is supplied", async () => {
    const { render } = await setup()
    const meta = await render(page({ frontmatter: {} }))
    expect(meta).toContainEqual({ property: "og:image:alt", content: "Intro" })
  })

  it("supports Ardo locale identifiers that are not Intl language tags", async () => {
    const { render } = await setup()
    await expect(render(page({ locale: "en_US" }))).resolves.toBeDefined()
  })

  it("rejects malformed opt-in settings without allowing font downloads", () => {
    expect(() => validateShareImagesConfig(false)).not.toThrow()
    for (const config of [
      { fonts: [], fontFamily: "A" },
      { fonts: ["https://example.test/font.ttf"], fontFamily: "A" },
      { fonts: [font], fontFamily: "" },
    ])
      expect(() => validateShareImagesConfig(config)).toThrow("shareImages")
  })
})

function countDarkPixels(data: Buffer, channels: number): number {
  let dark = 0
  for (let i = 0; i < data.length; i += channels)
    if (data[i] < 100 && data[i + 1] < 100 && data[i + 2] < 100) dark++
  return dark
}
function countMeta(meta: ArdoMetaDescriptor[] | undefined, name: string): number {
  return meta?.filter((entry) => "name" in entry && entry.name === name).length ?? 0
}
