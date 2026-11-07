import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { resolveConfig } from "../config"
import type { Post, Publication } from "../publication/types"
import { preparePublication } from "./publication"
import { publicationModuleCode } from "./publication-module"
import { createPageMetadata } from "./page-metadata"
import { createCurrentRouteIdentity } from "./route-identity"
import type { RouteManifestEntry } from "./route-manifest"
import { sitemapLastmod } from "./sitemap"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function temporary(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-publication-module-"))
  roots.push(root)
  return root
}

/** A publication of `count` posts by two shared authors, as the publication plugin prepares it. */
async function publicationOf(count: number, trailingSlash?: boolean) {
  const root = await temporary()
  await fs.mkdir(path.join(root, "posts"))
  for (let index = 0; index < count; index++)
    await fs.writeFile(
      path.join(root, "posts", `post-${index}.md`),
      `---\nid: post-${index}\ntitle: Post ${index}\ndescription: Summary of post ${index}.\npublishedAt: 2026-01-${String((index % 28) + 1).padStart(2, "0")}T10:00:00Z\nauthors: [alex, sam]\ntags: [design]\nnextStep: /contact\n---\nBody.\n`
    )
  const config = resolveConfig(
    {
      title: "Example",
      siteUrl: "https://example.test",
      base: "/project/",
      ...(trailingSlash === undefined ? {} : { trailingSlash }),
    },
    root
  )
  const prepared = await preparePublication({
    options: {
      from: "posts",
      authors: {
        alex: { name: "Alex Morgan", title: "Design engineer", url: "https://alex.example" },
        sam: { name: "Sam Rivera", description: "Writes about software.", did: "did:plc:sam" },
      },
    },
    config,
    routesDir: path.join(root, "app/routes"),
  })
  return { root, publication: prepared.publication }
}

/** Load the generated module source the way Vite would. */
async function load(code: string): Promise<{ publications: Record<string, Publication> }> {
  const file = path.join(await temporary(), "publication.mjs")
  await fs.writeFile(file, code)
  return import(pathToFileURL(file).href) as Promise<{ publications: Record<string, Publication> }>
}

describe("virtual:ardo/publication", () => {
  it.each([undefined, true, false])(
    "rebuilds the public Post shape from shared fields (trailingSlash %s)",
    async (trailingSlash) => {
      const { publication } = await publicationOf(3, trailingSlash)
      const module = await load(publicationModuleCode({ default: publication }, "default"))
      // The earlier module shipped JSON, which drops undefined keys; the data is the same.
      // eslint-disable-next-line unicorn/prefer-structured-clone -- JSON semantics are the point
      const shipped = JSON.parse(JSON.stringify(publication)) as Publication
      // Custom fields stay on each post's own page.
      const listed = { ...shipped, posts: shipped.posts.map((post) => ({ ...post, data: {} })) }
      expect(module.publications.default).toStrictEqual(listed)
    }
  )

  it("ships shared publication fields and authors once", async () => {
    const { publication } = await publicationOf(50)
    const before = JSON.stringify({ default: publication }).length
    const code = publicationModuleCode({ default: publication }, "default")
    const data = String(/const _ardoData = (.*);\n/u.exec(code)?.[1])
    expect(data.split('"name":"Alex Morgan"')).toHaveLength(2)
    expect(data).not.toContain('"publicationName"')
    expect(data).not.toContain('"url":"https://example.test/project/news/post-')
    // 50 posts: ≈43 KB of repeated fields before, about half after (exact numbers in the PR).
    expect(code.length).toBeLessThan(before * 0.6)
  })

  it("freezes the data, so a site module's mutation throws instead of reordering other pages", async () => {
    const { publication } = await publicationOf(3)
    const { publications } = await load(publicationModuleCode({ default: publication }, "default"))
    const posts = publications.default.posts as Post[]
    const order = posts.map((post) => post.id)
    expect(() => posts.sort((left, right) => left.id.localeCompare(right.id))).toThrow(TypeError)
    expect(() => posts.reverse()).toThrow(TypeError)
    expect(() => (posts[0].tags as string[]).push("x")).toThrow(TypeError)
    expect(posts.map((post) => post.id)).toStrictEqual(order)
    expect(Object.isFrozen(posts[0].authors[0])).toBe(true)
  })
})

describe("custom post fields", () => {
  it("pass frontmatter fields Ardo does not know to post.data", async () => {
    const { publication } = await publicationOf(1)
    expect(publication.posts[0].data).toStrictEqual({ nextStep: "/contact" })
  })
})

const commit = () => Date.parse("2026-03-01T00:00:00Z")

describe("sitemap lastmod", () => {
  const config = resolveConfig({ title: "Docs", siteUrl: "https://example.com" }, "/site")
  const entry = (frontmatter: Record<string, unknown>, lastmod: string): RouteManifestEntry => {
    const identity = createCurrentRouteIdentity("/guide", config)
    return {
      anchors: [],
      content: "",
      filePath: "/site/app/routes/guide.mdx",
      frontmatter,
      identity,
      lastmod: new Date(lastmod),
      metadata: createPageMetadata({ frontmatter, identity, sourcePath: "guide.mdx" }),
      path: identity.routePath,
      publicPath: identity.publicPath,
      routePath: identity.routePath,
      source: "markdown",
    }
  }
  it("prefers a post's dates, then the page's last commit, then its file time", () => {
    const post = entry({ publishedAt: "2026-02-01T00:00:00Z" }, "2026-02-01T00:00:00Z")
    expect(sitemapLastmod(post, config, commit).toISOString()).toBe("2026-02-01T00:00:00.000Z")
    const page = entry({}, "2026-11-07T12:00:00Z")
    expect(sitemapLastmod(page, config, commit).toISOString()).toBe("2026-03-01T00:00:00.000Z")
    expect(sitemapLastmod(page, config).toISOString()).toBe("2026-11-07T12:00:00.000Z")
  })

  it("never reports a change after a pinned buildTime", () => {
    const pinned = { buildTime: "2026-06-01T00:00:00.000Z" }
    const untracked = entry({}, "2026-11-07T12:00:00Z")
    expect(sitemapLastmod(untracked, pinned).toISOString()).toBe(pinned.buildTime)
    expect(sitemapLastmod(untracked, pinned, commit).toISOString()).toBe("2026-03-01T00:00:00.000Z")
  })
})
