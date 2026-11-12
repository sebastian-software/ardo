import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { resolveConfig } from "../config"
import type { PublicationConfig } from "../publication/types"
import { transformMarkdownMeta } from "./markdown-meta"
import { compileMdxRouteModule } from "./mdx-compile"
import { preparePublication } from "./publication"
import {
  refreshPublication,
  reportInvalidAuthorUrls,
  type PublicationBuilder,
} from "./publication-materialize"
import { collectInvalidAuthorUrls, isAbsoluteHttpUrl } from "./publication-options"
import { createPublicationPlugin } from "./publication-plugin"

const roots: string[] = []
afterEach(async () => {
  vi.restoreAllMocks()
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

  it("reject a post's own meta export while a post module supplies the metadata", async () => {
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
    const compile = () =>
      compileMdxRouteModule({
        source: route.content,
        markdownConfig: undefined,
        format: "mdx",
        id: route.filePath,
        publicationPost: route.post,
      })
    expect(compile).toThrow(
      "[ardo] posts/first.mdx exports meta, but publication.components.post supplies the metadata of every post"
    )
  })

  it("keep a post's own meta export without a post module, as on any page", async () => {
    const p = await project()
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

const SCRIPT_URL = ["javascript", "alert(1)"].join(":")

describe("isAbsoluteHttpUrl", () => {
  it("accepts absolute http and https URLs with a host", () => {
    const values = [
      "https://people.example.test/sam",
      "http://example.test",
      "HTTPS://Example.test/Path?q=1#hash",
      "https://localhost:3000/",
    ]
    expect(values.filter((value) => !isAbsoluteHttpUrl(value))).toStrictEqual([])
  })

  it("rejects relative, scheme-only, other-scheme, padded, non-string, and malformed values", () => {
    const values = [
      "/people/sam",
      "people.example.test/sam",
      "//people.example.test/sam",
      "https:foo",
      "http:/x.test",
      "https://",
      "mailto:sam@example.test",
      SCRIPT_URL,
      "ftp://example.test",
      " https://example.test",
      "https://example.test ",
      "https://example.test\n",
      "https://exa mple.test",
      "",
      42,
      null,
      undefined,
      {},
      ["https://example.test"],
    ]
    expect(values.filter((value) => isAbsoluteHttpUrl(value))).toStrictEqual([])
  })
})

async function serving(command: "build" | "serve" = "serve") {
  const p = await project()
  for (const locale of ["en", "de"]) {
    await p.write(`${locale}/first`, "", { body: "A complete article." })
    await p.write(`${locale}/hidden`, "draft: true\n")
  }
  // The draft's author has no published post, and is still checked.
  for (const locale of ["en", "de"])
    await fs.writeFile(
      path.join(p.root, "posts", locale, "hidden.md"),
      "---\nid: hidden\ntitle: hidden\npublishedAt: 2026-01-02T10:00:00Z\nauthors: [ghost]\ndraft: true\n---\nDraft.\n"
    )
  const authors: Record<string, { name: string; url?: unknown }> = {
    alex: { name: "Alex", url: "/people/alex" },
    sam: { name: "Sam", url: "https://people.example.test/sam" },
    kim: { name: "Kim" },
    ghost: { name: "Ghost", url: "https:ghost.example.test" },
  }
  const config = resolveConfig(
    {
      title: "Example",
      siteUrl: "https://example.test",
      i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
    },
    p.root
  )
  const builder: PublicationBuilder = {
    options: { ...p.options, authors } as PublicationConfig,
    site: { resolvedConfig: config, routesDir: p.routesDir, command },
    prepared: [],
    publications: {},
    sources: new Map<string, string>(),
    posts: new Map(),
    queue: Promise.resolve(),
  }
  const warn = vi.spyOn(console, "warn").mockImplementation(vi.fn())
  return {
    builder,
    authors,
    warn,
    messages: () => warn.mock.calls.map((call) => String(call[0])),
  }
}

/** A Vite plugin hook, called with the plugin context a test supplies. */
const hook = (value: unknown) => value as (this: unknown, ...args: unknown[]) => unknown

describe("invalid author URLs", () => {
  it("warn once per author across locales and refreshes in serve, also for a draft-only author", async () => {
    const { builder, warn, messages } = await serving()
    await refreshPublication(builder)
    await refreshPublication(builder)
    expect(warn).toHaveBeenCalledTimes(2)
    expect(messages().sort()).toStrictEqual([
      '[ardo] publication.authors.alex.url must be an absolute http:// or https:// URL, but is "/people/alex". Ardo leaves it out of structured data.',
      '[ardo] publication.authors.ghost.url must be an absolute http:// or https:// URL, but is "https:ghost.example.test". Ardo leaves it out of structured data.',
    ])
  })

  it("warn again only when an author gets another invalid value", async () => {
    const { builder, authors, warn, messages } = await serving()
    await refreshPublication(builder)
    authors.alex.url = "/people/alex-morgan"
    await refreshPublication(builder)
    expect(warn).toHaveBeenCalledTimes(3)
    expect(messages()[2]).toContain("publication.authors.alex.url must be")
    expect(messages()[2]).toContain('"/people/alex-morgan"')
    authors.alex.url = "https://people.example.test/alex"
    await refreshPublication(builder)
    expect(warn).toHaveBeenCalledTimes(3)
  })

  it("wait in a build until the client output reports them, once however often it is called", async () => {
    const { builder, warn } = await serving("build")
    await refreshPublication(builder)
    await refreshPublication(builder)
    expect(warn).not.toHaveBeenCalled()
    reportInvalidAuthorUrls(builder)
    reportInvalidAuthorUrls(builder)
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it("warn once in a build, from the plugin's client output and never from its SSR output", async () => {
    const p = await project()
    await p.write("first")
    const plugin = createPublicationPlugin(
      { from: "posts", authors: { alex: { name: "Alex", url: "/people/alex" } } },
      { resolvedConfig: p.config, routesDir: p.routesDir, command: "build" }
    )
    const warn = vi.spyOn(console, "warn").mockImplementation(vi.fn())
    const emitFile = vi.fn()
    const generateBundle = (name: string) =>
      hook(plugin.generateBundle).call({ environment: { name }, emitFile }, {}, {}, false)
    await hook(plugin.configResolved).call(undefined, { root: p.root, publicDir: "" })
    expect(warn).not.toHaveBeenCalled()
    generateBundle("ssr")
    expect(warn).not.toHaveBeenCalled()
    expect(emitFile).not.toHaveBeenCalled()
    generateBundle("client")
    generateBundle("ssr")
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toBe(
      '[ardo] publication.authors.alex.url must be an absolute http:// or https:// URL, but is "/people/alex". Ardo leaves it out of structured data.'
    )
  })

  it("collect every invalid kind of value, and skip valid or missing urls", () => {
    const invalid = collectInvalidAuthorUrls({
      from: "posts",
      authors: {
        relative: { name: "A", url: "/a" },
        scheme: { name: "B", url: "https:b" },
        mail: { name: "C", url: "mailto:c@example.test" },
        script: { name: "D", url: SCRIPT_URL },
        padded: { name: "E", url: " https://e.test" },
        number: { name: "F", url: 42 as never },
        malformed: { name: "G", url: "http://" },
        valid: { name: "H", url: "http://h.test" },
        none: { name: "I" },
      },
    })
    expect(invalid.map((entry) => entry.id)).toStrictEqual([
      "relative",
      "scheme",
      "mail",
      "script",
      "padded",
      "number",
      "malformed",
    ])
    expect(invalid.find((entry) => entry.id === "number")?.value).toBe(42)
  })

  it("neither warn nor throw without authors or for a profile that is not an object", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(vi.fn())
    expect(collectInvalidAuthorUrls({ from: "posts" } as PublicationConfig)).toStrictEqual([])
    expect(
      collectInvalidAuthorUrls({
        from: "posts",
        authors: { none: null, text: "Sam", count: 3, list: [] } as never,
      })
    ).toStrictEqual([])
    expect(collectInvalidAuthorUrls({ from: "posts", authors: null as never })).toStrictEqual([])
    expect(warn).not.toHaveBeenCalled()
  })
})
