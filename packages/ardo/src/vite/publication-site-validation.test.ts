import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { resolveConfig } from "../config"
import type { PublicationConfig } from "../publication/types"
import { compileMdxRouteModule } from "./mdx-compile"
import { preparePublication } from "./publication"
import { refreshPublication } from "./publication-materialize"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function project(siteUrl = "https://example.test") {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-publication-validation-"))
  roots.push(root)
  await fs.mkdir(path.join(root, "posts"))
  const options: PublicationConfig = { from: "posts", authors: { alex: { name: "Alex" } } }
  const config = resolveConfig({ title: "Example", siteUrl, base: "/project/" }, root)
  const write = async (
    name: string,
    metadata = "",
    { body = "A complete article.", ext = "md" } = {}
  ) => {
    await fs.mkdir(path.dirname(path.join(root, "posts", name)), { recursive: true })
    await fs.writeFile(
      path.join(root, "posts", `${name}.${ext}`),
      `---\nid: ${path.basename(name)}\ntitle: ${path.basename(name)}\npublishedAt: 2026-01-02T10:00:00Z\nauthors: [alex]\n${metadata}---\n${body}\n`
    )
  }
  return { root, options, config, routesDir: path.join(root, "app/routes"), write }
}

describe("publication option validation", () => {
  it("rejects unknown keys, non-object groups, and tag views without tag archives", async () => {
    const p = await project()
    await p.write("first")
    const attempt = (options: Partial<PublicationConfig>) =>
      preparePublication({ ...p, options: { ...p.options, ...options } as PublicationConfig })
    await expect(attempt({ components: { overview: "x.tsx" } as never })).rejects.toThrow(
      "[ardo] Unknown option publication.components.overview. Supported: index, post, tag."
    )
    await expect(attempt({ feeds: { ids: "post" } as never })).rejects.toThrow(
      "Unknown option publication.feeds.ids"
    )
    await expect(attempt({ meta: "post" as never })).rejects.toThrow(
      "[ardo] publication.meta must be an object."
    )
    await expect(attempt({ meta: { tag: () => [] } })).rejects.toThrow(
      "[ardo] publication.meta.tag needs tags: true"
    )
    await expect(attempt({ components: { tag: "x.tsx" } })).rejects.toThrow(
      "[ardo] publication.components.tag needs tags: true"
    )
  })
})

describe("site metadata functions", () => {
  it("name the route when they throw or do not return synchronously", async () => {
    const p = await project()
    await p.write("first", "tags: [design]\n")
    p.options.tags = true
    p.options.meta = {
      post() {
        throw new Error("boom")
      },
    }
    await expect(preparePublication(p)).rejects.toThrow(
      '[ardo] publication.meta.post failed for post "first": boom'
    )
    p.options.meta = { tag: (async () => []) as never }
    await expect(preparePublication(p)).rejects.toThrow(
      'publication.meta.tag must synchronously return an array of meta descriptors (tag "design").'
    )
  })

  it("receive a frozen copy of the publication data", async () => {
    const p = await project()
    await p.write("first")
    const frozen: boolean[] = []
    p.options.meta = {
      post({ publication, post }) {
        frozen.push(Object.isFrozen(publication), Object.isFrozen(post), Object.isFrozen(post.tags))
        return [{ title: post.title }]
      },
    }
    const result = await preparePublication(p)
    expect(frozen).toStrictEqual([true, true, true])
    expect(Object.isFrozen(result.publication.posts[0])).toBe(false)
  })
})

describe("generated post routes", () => {
  it("drop authored internal fields", async () => {
    const p = await project()
    await p.write("first", "_ardoMeta:\n  - title: Injected\n_ardoPost:\n  title: Injected\n")
    const result = await preparePublication(p)
    expect(result.routes[0].content).not.toContain("Injected")
  })

  it("reject a post's own meta export while publication.meta.post is set", async () => {
    const p = await project()
    await p.write("first", "feedContent: Body text.\n", {
      body: "export const meta = () => []\n\nBody text.",
      ext: "mdx",
    })
    p.options.meta = { post: ({ post }) => [{ title: post.title }] }
    const result = await preparePublication(p)
    const route = result.routes[0]
    expect(() =>
      compileMdxRouteModule({
        source: route.content,
        markdownConfig: undefined,
        format: "mdx",
        id: route.filePath,
      })
    ).toThrow("declares its own meta, but publication.meta.post supplies the metadata")
  })
})

describe("publication-qualified feed entry IDs", () => {
  it("stay stable across a scheme change and the trailing-slash policy", async () => {
    const ids = []
    for (const [siteUrl, trailingSlash] of [
      ["https://example.test", true],
      ["http://example.test", false],
    ] as const) {
      const p = await project(siteUrl)
      await p.write("first")
      p.options.feeds = { entryIds: "publication" }
      p.options.trailingSlash = trailingSlash
      const result = await preparePublication(p)
      const atom = result.feeds[0].source
      ids.push(/<entry><id>([^<]+)<\/id>/u.exec(atom)?.[1])
    }
    expect(ids).toStrictEqual([
      "urn:ardo:publication:example.test/project/news:post:first",
      "urn:ardo:publication:example.test/project/news:post:first",
    ])
  })
})

async function localized(deTags: string) {
  const p = await project()
  await p.write("en/first", "tags: [design]\n")
  await p.write("de/first", deTags)
  const config = resolveConfig(
    {
      title: "Example",
      siteUrl: "https://example.test",
      i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
    },
    p.root
  )
  const builder = {
    options: { ...p.options, tags: true },
    site: { resolvedConfig: config, routesDir: p.routesDir },
    prepared: [],
    publications: {},
    sources: new Map<string, string>(),
    queue: Promise.resolve(),
  }
  return { p, refresh: () => refreshPublication(builder) }
}

describe("localized tag archives", () => {
  it("need the same tag keys in every locale", async () => {
    const { refresh } = await localized("")
    await expect(refresh()).rejects.toThrow(
      '[ardo] Tag "design" exists in en but not de; tag archives need the same keys in every locale.'
    )
  })

  it("generate each archive in every locale", async () => {
    const { p, refresh } = await localized("tags: [design]\n")
    await refresh()
    for (const locale of ["en", "de"])
      await expect(
        fs.stat(path.join(p.routesDir, locale, "news/tags/design/index.tsx"))
      ).resolves.toBeDefined()
  })
})
