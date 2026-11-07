import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { resolveConfig } from "../config"
import type { ArdoConfig } from "../config/types"
import type { PublicationConfig } from "../publication/types"
import { transformMarkdownMeta } from "./markdown-meta"
import { compileMdxRouteModule } from "./mdx-compile"
import { preparePublication } from "./publication"
import { loadVirtualModule, resolveVirtualModuleId } from "./virtual-modules"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function project(site: Partial<ArdoConfig> = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-publication-site-"))
  roots.push(root)
  await fs.mkdir(path.join(root, "posts"))
  const options: PublicationConfig = { from: "posts", authors: { alex: { name: "Alex" } } }
  const config = resolveConfig(
    { title: "Example", siteUrl: "https://example.test", base: "/project/", ...site },
    root
  )
  const routesDir = path.join(root, "app/routes")
  const write = (name: string, metadata = "", body = "A complete article.") =>
    fs.writeFile(
      path.join(root, "posts", `${name}.md`),
      `---\nid: ${name}\ntitle: ${name}\npublishedAt: 2026-01-02T10:00:00Z\nauthors: [alex]\n${metadata}---\n${body}\n`
    )
  return { root, options, config, routesDir, write }
}

function routeAt(routes: Array<{ filePath: string; content: string }>, relative: string) {
  const route = routes.find((entry) => entry.filePath.endsWith(relative))
  if (route == null) throw new Error(`No generated route ${relative}`)
  return route
}

describe("site-supplied publication metadata", () => {
  it("replaces the generated index metadata", async () => {
    const p = await project()
    await p.write("first")
    const received: string[] = []
    p.options.meta = {
      index({ publication }) {
        received.push(...publication.posts.map((post) => post.id))
        return [
          { title: "Blog" },
          { tagName: "link", rel: "canonical", href: "https://example.test/blog" },
        ]
      },
    }
    const result = await preparePublication(p)
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(received).toStrictEqual(["first"])
    expect(index).toContain(
      'export const meta = () => [{"title":"Blog"},{"tagName":"link","rel":"canonical","href":"https://example.test/blog"}]'
    )
    expect(index).not.toContain("https://example.test/project/news/")
  })

  it("makes site post metadata the complete metadata of the post route", async () => {
    const p = await project()
    await p.write("first", "description: Summary\n")
    p.options.meta = {
      post: ({ post, publication }) => [
        { title: `${post.title} – ${publication.name}` },
        { tagName: "link", rel: "canonical", href: `https://example.test/blog/${post.id}` },
      ],
    }
    const result = await preparePublication(p)
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    expect(route.content).toContain("_ardoMeta:")
    const compiled = compileMdxRouteModule({
      source: route.content,
      markdownConfig: undefined,
      format: "md",
      id: route.filePath,
    }).code
    expect(compiled).toContain(
      'export const meta = () => [{"title":"first – News"},{"tagName":"link","rel":"canonical","href":"https://example.test/blog/first"}];'
    )
    expect(
      transformMarkdownMeta(compiled, route.filePath, {
        routesDir: p.routesDir,
        resolvedConfig: p.config,
      })
    ).toBeUndefined()
  })

  it("keeps derived metadata for generated posts without site metadata", async () => {
    const p = await project()
    await p.write("first")
    const result = await preparePublication(p)
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    expect(route.content).not.toContain("_ardoMeta")
    const compiled = compileMdxRouteModule({
      source: route.content,
      markdownConfig: undefined,
      format: "md",
      id: route.filePath,
    }).code
    const code = transformMarkdownMeta(compiled, route.filePath, {
      routesDir: p.routesDir,
      resolvedConfig: p.config,
    })?.code
    expect(code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.test/project/news/first" }'
    )
  })

  it("rejects metadata that is not a list of descriptors", async () => {
    const p = await project()
    await p.write("first")
    p.options.meta = { post: () => "title" as never }
    await expect(preparePublication(p)).rejects.toThrow(
      '[ardo] publication.meta.post must synchronously return an array of meta descriptors (post "first").'
    )
  })
})

describe("site-supplied publication components", () => {
  it("renders the overview with a site component, relative to the generated route", async () => {
    const p = await project()
    await p.write("first")
    await fs.mkdir(path.join(p.root, "app/blog"), { recursive: true })
    await fs.writeFile(path.join(p.root, "app/blog/Overview.tsx"), "export default () => null\n")
    p.options.components = { index: "app/blog/Overview.tsx" }
    const result = await preparePublication(p)
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(index).toContain('import PublicationIndex from "../../blog/Overview.tsx"')
    expect(index).toContain("<PublicationIndex publication={publication} />")
    expect(index).not.toContain("ArdoPostList")
  })

  it("rejects a component module that does not exist", async () => {
    const p = await project()
    await p.write("first")
    p.options.components = { post: "app/blog/Missing.tsx" }
    await expect(preparePublication(p)).rejects.toThrow("publication.components.post")
  })

  it("resolves the post frame module for every page, also without a configured frame", async () => {
    const id = resolveVirtualModuleId("virtual:ardo/publication-post")
    expect(id).toBe("\0virtual:ardo/publication-post")
    const p = await project()
    const state = { resolvedConfig: p.config, routesDir: p.routesDir }
    expect(await loadVirtualModule(id!, state)).toBe("export default null;")
    expect(
      await loadVirtualModule(id!, { ...state, publicationPostComponent: "app/blog/Post.tsx" })
    ).toBe(`export { default } from ${JSON.stringify(`${p.root}/app/blog/Post.tsx`)};`)
  })
})

describe("publication URLs and feeds", () => {
  it("omits trailing slashes from publication, post, and feed URLs when configured", async () => {
    const p = await project()
    await p.write("first", "", "[Jump](#detail)")
    p.options.trailingSlash = false
    const result = await preparePublication(p)
    expect(result.publication.url).toBe("https://example.test/project/news")
    expect(result.publication.posts[0].url).toBe("https://example.test/project/news/first")
    const atom = result.feeds[0].source
    expect(atom).toContain('<link href="https://example.test/project/news"/>')
    expect(atom).toContain('<link href="https://example.test/project/news/first"/>')
    expect(atom).toContain("https://example.test/project/news/first#detail")
    expect(atom).not.toMatch(/https:\/\/example\.test\/project\/news(?:\/first)?\/[<"#]/u)
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(index).toContain('"href":"https://example.test/project/news"')
  })

  it("qualifies feed entry IDs by publication on request, keeping post IDs by default", async () => {
    const p = await project()
    await p.write("first")
    const plain = await preparePublication(p)
    expect(plain.feeds[0].source).toContain("<id>urn:ardo:post:first</id>")
    p.options.feeds = { entryIds: "publication" }
    const news = await preparePublication(p)
    const blog = await preparePublication({ ...p, options: { ...p.options, to: "blog" } })
    expect(news.feeds[0].source).toContain(
      "<id>urn:ardo:publication:example.test/project/news:post:first</id>"
    )
    expect(news.feeds[1].source).toContain(
      '<guid isPermaLink="false">urn:ardo:publication:example.test/project/news:post:first</guid>'
    )
    expect(blog.feeds[0].source).toContain(
      "<id>urn:ardo:publication:example.test/project/blog:post:first</id>"
    )
  })

  it("declares the site or locale language in both feeds", async () => {
    const p = await project({ lang: "de-DE" })
    await p.write("first")
    const result = await preparePublication(p)
    expect(result.feeds[0].source).toContain(
      '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de-DE">'
    )
    expect(result.feeds[1].source).toContain("<language>de-DE</language>")
    await fs.mkdir(path.join(p.root, "posts/en"))
    await fs.rename(path.join(p.root, "posts/first.md"), path.join(p.root, "posts/en/first.md"))
    p.config = resolveConfig(
      {
        title: "Example",
        siteUrl: "https://example.test",
        lang: "de-DE",
        i18n: { defaultLocale: "en", locales: [{ id: "en" }] },
      },
      p.root
    )
    const localized = await preparePublication({ ...p, localeId: "en" })
    expect(localized.feeds[0].source).toContain('xml:lang="en"')
    expect(localized.feeds[1].source).toContain("<language>en</language>")
  })
})

describe("tag archives", () => {
  it("generates one listed archive per tag key and keeps keys as feed categories", async () => {
    const p = await project()
    await p.write("first", "tags: [design, release-notes]\n")
    await p.write("second", "tags: [design]\n")
    p.options.tags = true
    const result = await preparePublication(p)
    expect(result.publication.tags).toStrictEqual([
      {
        key: "design",
        path: "/news/tags/design",
        url: "https://example.test/project/news/tags/design/",
      },
      {
        key: "release-notes",
        path: "/news/tags/release-notes",
        url: "https://example.test/project/news/tags/release-notes/",
      },
    ])
    const design = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(design).toContain(
      'const tag = {"key":"design","path":"/news/tags/design","url":"https://example.test/project/news/tags/design/"}'
    )
    expect(design).toContain("<ArdoPostList publication={publication} tag={tag} />")
    // The default canonical matches the sitemap entry, as a post's does, whatever the URL policy.
    expect(design).toContain(
      '"rel":"canonical","href":"https://example.test/project/news/tags/design"}'
    )
    expect(result.feeds[0].source).toContain('<category term="release-notes"/>')
  })

  it("renders tag archives with site components and metadata", async () => {
    const p = await project()
    await p.write("first", "tags: [design]\n")
    await fs.mkdir(path.join(p.root, "app/blog"), { recursive: true })
    await fs.writeFile(path.join(p.root, "app/blog/Tag.tsx"), "export default () => null\n")
    p.options.trailingSlash = false
    p.options.tags = true
    p.options.components = { tag: "app/blog/Tag.tsx" }
    p.options.meta = {
      tag: ({ tag, posts }) => [{ title: `${tag.key} (${posts.length})` }],
    }
    const result = await preparePublication(p)
    expect(result.publication.tags?.[0].url).toBe("https://example.test/project/news/tags/design")
    const design = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(design).toContain('import PublicationTag from "../../../../blog/Tag.tsx"')
    expect(design).toContain("<PublicationTag publication={publication} tag={tag} posts={posts} />")
    expect(design).toContain('export const meta = () => [{"title":"design (1)"}]')
  })

  it("rejects tag keys that are not slugs, repeated keys, and colliding post paths", async () => {
    const p = await project()
    p.options.tags = true
    await p.write("first", "tags: [Design]\n")
    await expect(preparePublication(p)).rejects.toThrow(
      'Tag "Design" must be a lowercase, hyphenated slug'
    )
    await p.write("first", "tags: [design, design]\n")
    await expect(preparePublication(p)).rejects.toThrow('lists tag "design" more than once')
    await p.write("first", "path: /news/tags/design\ntags: [design]\n")
    await expect(preparePublication(p)).rejects.toThrow("collides with the tag archives")
  })

  it("leaves free-form tags untouched while tag archives are off", async () => {
    const p = await project()
    await p.write("first", "tags: [Design Systems]\n")
    const result = await preparePublication(p)
    expect(result.publication.tags).toBeUndefined()
    expect(result.routes).toHaveLength(2)
  })
})
