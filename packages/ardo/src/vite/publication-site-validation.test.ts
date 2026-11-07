import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { resolveConfig } from "../config"
import type { PublicationConfig } from "../publication/types"
import { transformMarkdownMeta } from "./markdown-meta"
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
  it("rejects unknown keys, non-object groups, bad module paths, and tag views without archives", async () => {
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
    await expect(attempt({ components: "post" as never })).rejects.toThrow(
      "[ardo] publication.components must be an object."
    )
    await expect(attempt({ tagLabel: 42 as never })).rejects.toThrow(
      "[ardo] publication.tagLabel must be a module path."
    )
    await expect(attempt({ components: { tag: "x.tsx" } })).rejects.toThrow(
      "[ardo] publication.components.tag needs tags: true"
    )
  })
})

describe("generated post routes", () => {
  it("drop the authored internal field", async () => {
    const p = await project()
    await p.write("first", "_ardoPost:\n  title: Injected\n")
    const result = await preparePublication(p)
    expect(result.routes[0].content).not.toContain("Injected")
  })

  it("keep a post's own meta export, which replaces the site module's metadata", async () => {
    const p = await project()
    await fs.mkdir(path.join(p.root, "app/blog"), { recursive: true })
    await fs.writeFile(path.join(p.root, "app/blog/Post.tsx"), "export default () => null\n")
    p.options.components = { post: "app/blog/Post.tsx" }
    await p.write("first", "feedContent: Body text.\n", {
      body: 'export const meta = () => [{ title: "Own" }]\n\nBody text.',
      ext: "mdx",
    })
    const result = await preparePublication(p)
    const route = result.routes[0]
    const compiled = compileMdxRouteModule({
      source: route.content,
      markdownConfig: undefined,
      format: "mdx",
      id: route.filePath,
      publicationPost: route.post,
    }).code
    expect(compiled).toContain('export const meta = () => [{ title: "Own" }]')
    expect(
      transformMarkdownMeta(compiled, route.filePath, {
        routesDir: p.routesDir,
        resolvedConfig: p.config,
        publicationPost: () => route.post,
      })
    ).toBeUndefined()
  })
})

describe("publication-qualified feed entry IDs", () => {
  it("stay stable across a scheme change and the site's trailing-slash setting", async () => {
    const ids = []
    for (const [siteUrl, trailingSlash] of [
      ["https://example.test", true],
      ["http://example.test", false],
    ] as const) {
      const p = await project(siteUrl)
      p.config = { ...p.config, trailingSlash }
      await p.write("first")
      p.options.feeds = { entryIds: "publication" }
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
    posts: new Map(),
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
