import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterEach, describe, expect, it } from "vitest"
import { resolveConfig } from "../config"
import type { PublicationConfig } from "../publication/types"
import { calculateImageCrop, preparePostImage } from "./post-images"
import { preparePublication } from "./publication"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function project() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-publication-"))
  roots.push(root)
  await fs.mkdir(path.join(root, "posts"))
  const options: PublicationConfig = {
    from: "posts",
    authors: {
      alex: { name: "Alex", title: "Engineer", did: "did:plc:alex" },
      sam: { name: "Sam" },
    },
  }
  const config = resolveConfig(
    { title: "Example", siteUrl: "https://example.test", base: "/project/" },
    root
  )
  const routesDir = path.join(root, "app/routes")
  const write = (
    name: string,
    metadata = "",
    body = "A complete article with **readable prose**."
  ) =>
    fs.writeFile(
      path.join(root, "posts", `${name}.mdx`),
      `---\nid: ${name}\ntitle: ${name}\npublishedAt: 2026-01-02T10:00:00Z\nauthors: [alex, sam]\n${metadata}---\n${body}\n`
    )
  return { root, options, config, routesDir, write }
}

describe("publication lifecycle and portable output", () => {
  it("emits full Atom/RSS content in chronological order, excluding drafts and scheduled posts everywhere", async () => {
    const p = await project()
    await p.write("first")
    await p.write("newer", "updatedAt: 2026-03-04T10:00:00Z\npath: /news/stable-address\n")
    await p.write("draft", "draft: true\n", "Draft secret")
    await p.write("scheduled", "", "Scheduled secret")
    const scheduled = path.join(p.root, "posts/scheduled.mdx")
    const scheduledSource = await fs.readFile(scheduled, "utf8")
    await fs.writeFile(scheduled, scheduledSource.replace("2026-01-02", "2099-01-02"))
    const result = await preparePublication({ ...p, now: new Date("2026-05-01") })
    expect(result.publication.posts.map((post) => post.id)).toStrictEqual(["first", "newer"])
    expect(result.publication.posts[1].url).toBe(
      "https://example.test/project/news/stable-address/"
    )
    expect(result.publication.posts[0].authors.map((author) => author.name)).toStrictEqual([
      "Alex",
      "Sam",
    ])
    expect(result.routes).toHaveLength(3)
    for (const feed of result.feeds) {
      expect(feed.source).toContain("&lt;strong&gt;readable prose&lt;/strong&gt;")
      expect(feed.source).toContain("Alex")
      expect(feed.source).toContain("Sam")
      expect(feed.source).not.toContain("secret")
      expect(feed.source).toContain("urn:ardo:post:newer")
    }
    expect(result.routes[0].content).toContain("_ardoPost:")
    expect(result.routes[0].sourceFile).toBe(path.join(p.root, "posts/first.mdx"))
  })

  it("keeps identity when a source/path is renamed, and rejects duplicate IDs", async () => {
    const p = await project()
    await p.write("first", "path: /news/a\n")
    const initial = await preparePublication(p)
    const source = path.join(p.root, "posts/first.mdx")
    const originalSource = await fs.readFile(source, "utf8")
    await fs.writeFile(source, originalSource.replace("/news/a", "/news/b"))
    await fs.rename(source, path.join(p.root, "posts/renamed.mdx"))
    const renamed = await preparePublication(p)
    expect(initial.feeds[0].source).toContain("urn:ardo:post:first")
    expect(renamed.feeds[0].source).toContain("urn:ardo:post:first")
    await fs.copyFile(path.join(p.root, "posts/renamed.mdx"), path.join(p.root, "posts/copy.mdx"))
    await expect(preparePublication(p)).rejects.toThrow("Duplicate post id")
  })

  it("requires an explicit complete portable article for MDX components", async () => {
    const p = await project()
    await p.write("interactive", "", "Before.\n\n<Counter />\n\nAfter.")
    await expect(preparePublication(p)).rejects.toThrow("needs feedContent")
    await p.write(
      "interactive",
      "feedContent: |\n  Before. A static description of the counter. After.\n",
      "Before.\n\n<Counter />\n\nAfter."
    )
    const result = await preparePublication(p)
    expect(result.feeds[0].source).toContain("A static description of the counter")
    expect(result.routes[0].content).toContain("<Counter />")
  })

  it("keeps configured Markdown syntax, local anchors, and linked images intact in feeds", async () => {
    const p = await project()
    await sharp({ create: { width: 80, height: 60, channels: 3, background: "olive" } })
      .png()
      .toFile(path.join(p.root, "posts/photo.png"))
    p.config.markdown.headingAttributes = true
    await p.write(
      "references",
      "",
      "## A 🌱 heading {#custom}\n\n[Jump](#custom)\n\n[![Scene](./photo.png)](/guide/start)"
    )
    const result = await preparePublication(p)
    const feed = result.feeds[0].source
    expect(feed).toContain("https://example.test/project/news/references/#custom")
    expect(feed).toContain("id=&quot;custom&quot;")
    expect(feed).not.toContain("{#custom}")
    expect(feed).toContain("https://example.test/project/guide/start/")
    expect(feed).toContain("https://example.test/project/assets/posts/")
    expect(feed).not.toContain("./photo.png")
  })

  it("prepares colocated cover and inline images with absolute feed URLs", async () => {
    const p = await project()
    await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#e64136" } })
      .png()
      .toFile(path.join(p.root, "posts/photo.png"))
    await p.write(
      "photo",
      "coverImage:\n  src: ./photo.png\n  alt: A red scene\n  core: { x: 0.8, y: 0.5, size: 0.2 }\nimages:\n  ./photo.png:\n    frame: { x: 0.4, y: 0.2, width: 0.5, height: 0.6 }\n",
      "![Scene](./photo.png)\n\n[Docs](/guide/setup)"
    )
    p.config = resolveConfig(
      {
        title: "Example",
        siteUrl: "https://example.test",
        base: "/project/",
        versioning: {
          current: "v2",
          versions: [{ id: "v2", path: "/v2/" }],
          directories: ["guide"],
        },
      },
      p.root
    )
    const result = await preparePublication(p)
    expect(
      result.publication.posts[0].coverImage?.families.map((family) => family.composition)
    ).toStrictEqual(["16:10", "4:3"])
    expect(result.assets.size).toBeGreaterThan(0)
    expect(result.feeds[0].source).toContain("https://example.test/project/assets/posts/")
    expect(result.feeds[0].source).toContain("https://example.test/project/v2/guide/setup/")
    const rendition = result.publication.posts[0].images["./photo.png"].families[0].renditions[0]
    const bytes = result.assets.get(rendition.src.slice("/project/".length))!.source
    expect(await sharp(bytes).metadata()).toMatchObject({
      format: "webp",
      width: rendition.width,
      height: rendition.height,
    })
  })

  it("rejects versioned publication routes and traversal outside the generated subtree", async () => {
    const p = await project()
    await p.write("bad", "path: /news/../guide/escape\n")
    await expect(preparePublication(p)).rejects.toThrow("Post path must")
    p.config = resolveConfig(
      {
        title: "Example",
        siteUrl: "https://example.test",
        versioning: { current: "v2", versions: [{ id: "v2", path: "/v2/" }] },
      },
      p.root
    )
    await expect(preparePublication(p)).rejects.toThrow("must be unversioned")
  })

  it("keeps a localized publication under its locale without adding a version", async () => {
    const p = await project()
    await fs.mkdir(path.join(p.root, "posts/de"))
    await p.write("first")
    await fs.rename(path.join(p.root, "posts/first.mdx"), path.join(p.root, "posts/de/first.mdx"))
    p.config = resolveConfig(
      {
        title: "Example",
        siteUrl: "https://example.test",
        base: "/project/",
        i18n: { defaultLocale: "de", locales: [{ id: "de" }] },
        versioning: {
          current: "v2",
          versions: [{ id: "v2", path: "/v2/" }],
          directories: ["guide"],
        },
      },
      p.root
    )
    const result = await preparePublication({ ...p, localeId: "de" })
    expect(result.publication.posts[0].url).toBe("https://example.test/project/de/news/first/")
    expect(result.publication.posts[0].path).toBe("/de/news/first")
    expect(result.feeds[0].fileName).toBe("de/news/atom.xml")
    expect(result.routes[0].filePath).toContain("/app/routes/de/news/first/index.mdx")
  })
})

describe("image framing", () => {
  it("uses displayed dimensions after EXIF orientation", async () => {
    const p = await project()
    const file = path.join(p.root, "posts/portrait.jpg")
    await sharp({ create: { width: 120, height: 80, channels: 3, background: "red" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(file)
    const image = await preparePostImage({
      image: { src: "./portrait.jpg", alt: "Portrait" },
      sourceFile: path.join(p.root, "posts/a.md"),
      root: p.root,
      base: "/",
      assets: new Map(),
    })
    expect(image.families[0].renditions[0]).toMatchObject({ width: 80, height: 120 })
  })
  it("frames tightly around A, adds soft margin, and shifts inside the source", () => {
    const crop = calculateImageCrop({
      width: 1600,
      height: 1000,
      ratio: [8, 5],
      core: { x: 0.9, y: 0.5, size: 0.2 },
      margin: 0.15,
    })
    expect(crop.width).toBeLessThan(500)
    expect(crop.left + crop.width).toBeLessThanOrEqual(1600)
    expect(crop.left).toBeLessThanOrEqual(1340)
    expect(crop.left + crop.width).toBeGreaterThanOrEqual(1540)
    expect(crop.width / crop.height).toBe(1.6)
  })

  it("lets B set the composition but never cut into A, even when they are disjoint", () => {
    const crop = calculateImageCrop({
      width: 1600,
      height: 1000,
      ratio: [4, 3],
      core: { x: 0.8, y: 0.5, size: 0.2 },
      frame: { x: 0, y: 0, width: 0.2, height: 0.2 },
    })
    expect(crop.left).toBeLessThanOrEqual(1180)
    expect(crop.left + crop.width).toBeGreaterThanOrEqual(1380)
    expect(crop.top).toBeLessThanOrEqual(400)
    expect(crop.top + crop.height).toBeGreaterThanOrEqual(600)
  })

  it("reduces unavailable margin, while an impossible A is a hard error", () => {
    expect(() =>
      calculateImageCrop({
        width: 800,
        height: 1200,
        ratio: [8, 5],
        core: { x: 0.5, y: 0.5, size: 0.75 },
      })
    ).toThrow("Cannot preserve")
    expect(
      calculateImageCrop({
        width: 800,
        height: 1200,
        ratio: [4, 3],
        core: { x: 0.5, y: 0.5, size: 0.75 },
        margin: 0.4,
      })
    ).toMatchObject({ width: 800, height: 600 })
  })

  it("preserves unframed composition without upscaling and regenerates after original changes", async () => {
    const p = await project()
    const file = path.join(p.root, "posts/small.png")
    const create = (background: string) =>
      sharp({ create: { width: 120, height: 80, channels: 3, background } })
        .png()
        .toFile(file)
    await create("red")
    const assets = new Map()
    const input = {
      image: { src: "./small.png", alt: "Small" },
      sourceFile: path.join(p.root, "posts/a.md"),
      root: p.root,
      base: "/project/",
      assets,
    }
    const first = await preparePostImage(input)
    expect(first.families).toHaveLength(1)
    expect(first.families[0]).toMatchObject({
      composition: "original",
      renditions: [{ width: 120, height: 80 }],
    })
    await create("blue")
    const second = await preparePostImage(input)
    expect(second.families[0].renditions[0].src).not.toBe(first.families[0].renditions[0].src)
  })
})
