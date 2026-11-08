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
import type { PublicationPostBinding, PublicationRoute } from "./publication-routes"

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
  const module = async (relative: string, source = "export default () => null\n") => {
    await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true })
    await fs.writeFile(path.join(root, relative), source)
  }
  return { root, options, config, routesDir, write, module }
}

/** Compile a generated post route the way the Vite plugin does, with its binding. */
function compilePost(
  route: { filePath: string; content: string; post?: PublicationPostBinding },
  config: ReturnType<typeof resolveConfig>,
  routesDir: string
) {
  const compiled = compileMdxRouteModule({
    source: route.content,
    markdownConfig: undefined,
    format: "md",
    id: route.filePath,
    publicationPost: route.post,
  }).code
  const withMeta = transformMarkdownMeta(compiled, route.filePath, {
    routesDir,
    resolvedConfig: config,
    publicationPost: (file) => (file === route.filePath ? route.post : undefined),
  })?.code
  return { compiled, code: withMeta ?? compiled }
}

function routeAt(routes: PublicationRoute[], relative: string) {
  const route = routes.find((entry) => entry.filePath.endsWith(relative))
  if (route == null) throw new Error(`No generated route ${relative}`)
  return route
}

describe("publication route modules", () => {
  it("imports the index module with its optional meta, typed by its module contract", async () => {
    const p = await project()
    await p.write("first")
    await p.module("app/blog/Overview.tsx")
    p.options.components = { index: "app/blog/Overview.tsx" }
    const result = await preparePublication(p)
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(index).toContain('import * as view from "../../blog/Overview.tsx"')
    expect(index).toContain("const site: PublicationIndexModule = view")
    expect(index).toContain(
      "return site.meta == null ? defaults : site.meta({ publication, defaults })"
    )
    // Ardo's defaults are what the module's meta receives, and what applies without it.
    expect(index).toContain(
      '{"tagName":"link","rel":"canonical","href":"https://example.test/project/news/"}'
    )
    expect(index).toContain("<View publication={publication} />")
    expect(index).not.toContain("ArdoPostList")
    // The module's optional page data becomes the route's frontmatter, computed while it renders.
    expect(index).toContain("const siteFrontmatter = site.frontmatter")
    expect(index).toContain(
      "export const frontmatter = siteFrontmatter == null ? undefined : () => siteFrontmatter({ publication })"
    )
  })

  it("keeps Ardo's overview and metadata without a module", async () => {
    const p = await project()
    await p.write("first")
    const result = await preparePublication(p)
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(index).toContain("const View = ArdoPostList")
    expect(index).toContain("  return defaults\n")
    expect(index).not.toContain("site.meta")
    expect(index).not.toContain("frontmatter")
  })

  it("mounts the site's post module in the post route and hands it Ardo's metadata", async () => {
    const p = await project()
    await p.write("first", "description: Summary\n")
    await p.module("app/blog/Post.tsx")
    p.options.components = { post: "app/blog/Post.tsx" }
    const result = await preparePublication(p)
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    expect(route.post).toMatchObject({
      publication: "default",
      view: `${p.root}/app/blog/Post.tsx`,
      sourceFile: "posts/first.md",
    })
    expect(route.content).not.toContain("_ardoMeta")
    const { code } = compilePost(route, p.config, p.routesDir)
    expect(code).toContain(
      `import * as _ardoPostView from ${JSON.stringify(`${p.root}/app/blog/Post.tsx`)};`
    )
    expect(code).toContain("const _ArdoPostFrame = _ardoPostView.default;")
    expect(code).toContain("<_ArdoPostFrame post={_ardoFrontmatter._ardoPost}>")
    expect(code).toContain(
      'import { publications as _ardoPublications } from "virtual:ardo/publication";'
    )
    // The route's meta runs the site's export, if any, on the descriptors Ardo derives.
    expect(code).toMatch(
      /export const meta = \(\) => _ardoPostMeta\(\[\{ title: "first \| Example" \}.*\{ tagName: "link", rel: "canonical", href: "https:\/\/example\.test\/project\/news\/first" \}/u
    )
    expect(code).toContain(
      'return meta == null ? defaults : meta({ publication: _ardoPublications["default"], post: _ardoFrontmatter._ardoPost, defaults });'
    )
  })

  it("frames posts with Ardo's article and keeps derived metadata without a post module", async () => {
    const p = await project()
    await p.write("first")
    const result = await preparePublication(p)
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    expect(route.post).toMatchObject({ publication: "default" })
    expect(route.post?.view).toBeUndefined()
    const { code } = compilePost(route, p.config, p.routesDir)
    expect(code).toContain("ArdoPost as _ArdoPostFrame")
    expect(code).not.toContain("virtual:ardo/publication")
    expect(code).toContain('export const meta = () => _ardoPostMeta([{ title: "first | Example" }')
    // Every post's defaults end with the publication's feed links, like the index and tags.
    expect(code).toContain(
      '...[{"tagName":"link","rel":"alternate","type":"application/atom+xml","href":"https://example.test/project/news/atom.xml","title":"News"},{"tagName":"link","rel":"alternate","type":"application/rss+xml","href":"https://example.test/project/news/rss.xml","title":"News"}]'
    )
    expect(code).toContain("  return defaults;")
    // The post data is frozen before the frame or meta can see it.
    expect(code).toContain("_ardoFreeze(_ardoFrontmatter._ardoPost);")
    expect(code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.test/project/news/first" }'
    )
  })

  it("compiles other Markdown pages without any post frame", () => {
    const { code } = compileMdxRouteModule({
      source: "---\ntitle: Guide\n---\n# Guide\n",
      markdownConfig: undefined,
      format: "md",
      id: "/site/app/routes/guide.md",
    })
    expect(code).not.toContain("ArdoPost")
    expect(code).not.toContain("ArdoPublicationTags")
    expect(code).not.toContain("virtual:ardo/publication")
  })

  it("rejects missing modules and the options of the earlier revision", async () => {
    const p = await project()
    await p.write("first")
    p.options.components = { post: "app/blog/Missing.tsx" }
    await expect(preparePublication(p)).rejects.toThrow("publication.components.post")
    p.options.components = undefined
    p.options.tagLabel = "app/blog/missing-labels.ts"
    await expect(preparePublication(p)).rejects.toThrow(
      "publication.tagLabel must name an existing module"
    )
    p.options.tagLabel = undefined
    await expect(
      preparePublication({ ...p, options: { ...p.options, meta: {} } as PublicationConfig })
    ).rejects.toThrow("publication.meta was replaced by a meta export")
    await expect(
      preparePublication({
        ...p,
        options: { ...p.options, trailingSlash: false } as PublicationConfig,
      })
    ).rejects.toThrow(
      "publication.trailingSlash was replaced by the site-wide trailingSlash option"
    )
  })
})

describe("publication URLs and feeds", () => {
  it("omits trailing slashes from publication, post, and feed URLs with the site setting", async () => {
    const p = await project({ trailingSlash: false })
    await p.write("first", "", "[Jump](#detail) and [the guide](/guide/intro/)")
    const result = await preparePublication(p)
    expect(result.publication.url).toBe("https://example.test/project/news")
    expect(result.publication.posts[0].url).toBe("https://example.test/project/news/first")
    const atom = result.feeds[0].source
    expect(atom).toContain('<link href="https://example.test/project/news"/>')
    expect(atom).toContain('<link href="https://example.test/project/news/first"/>')
    expect(atom).toContain("https://example.test/project/news/first#detail")
    expect(atom).not.toMatch(/https:\/\/example\.test\/project\/news(?:\/first)?\/[<"#]/u)
    expect(atom).toContain("https://example.test/project/guide/intro")
    expect(atom).not.toContain("guide/intro/")
    const index = routeAt(result.routes, "app/routes/news/index.tsx").content
    expect(index).toContain('"rel":"canonical","href":"https://example.test/project/news"}')
  })

  it("ends every publication URL and default canonical with a slash with trailingSlash: true", async () => {
    const p = await project({ trailingSlash: true })
    await p.write("first", "tags: [design]\n")
    p.options.tags = true
    const result = await preparePublication(p)
    expect(result.publication.url).toBe("https://example.test/project/news/")
    expect(result.publication.posts[0].url).toBe("https://example.test/project/news/first/")
    expect(result.publication.tags?.[0].url).toBe("https://example.test/project/news/tags/design/")
    const tag = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(tag).toContain(
      '"rel":"canonical","href":"https://example.test/project/news/tags/design/"}'
    )
    const { code } = compilePost(
      routeAt(result.routes, "app/routes/news/first/index.md"),
      p.config,
      p.routesDir
    )
    expect(code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.test/project/news/first/" }'
    )
    expect(result.feeds[0].source).toContain(
      '<link href="https://example.test/project/news/first/"/>'
    )
  })

  it("keeps the earlier mixed spelling without the site setting", async () => {
    const p = await project()
    await p.write("first", "tags: [design]\n")
    p.options.tags = true
    const result = await preparePublication(p)
    expect(result.publication.url).toBe("https://example.test/project/news/")
    expect(result.publication.posts[0].url).toBe("https://example.test/project/news/first/")
    const tag = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(tag).toContain(
      '"rel":"canonical","href":"https://example.test/project/news/tags/design"}'
    )
    const { code } = compilePost(
      routeAt(result.routes, "app/routes/news/first/index.md"),
      p.config,
      p.routesDir
    )
    expect(code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.test/project/news/first" }'
    )
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
      'const tag = Object.freeze({"key":"design","path":"/news/tags/design","url":"https://example.test/project/news/tags/design/"})'
    )
    expect(design).toContain("<View publication={publication} tag={tag} />")
    expect(design).not.toContain("frontmatter")
    expect(design).toContain('label={label} archive={"/news/tags/"}')
    // The default canonical matches the sitemap entry, as a post's does, whatever the URL policy.
    expect(design).toContain(
      '"rel":"canonical","href":"https://example.test/project/news/tags/design"}'
    )
    expect(result.feeds[0].source).toContain('<category term="release-notes"/>')
  })

  it("renders tag archives with the site's module, label, and render-time metadata", async () => {
    const p = await project({ trailingSlash: false })
    await p.write("first", "tags: [design]\n")
    await p.module("app/blog/Tag.tsx")
    await p.module("app/blog/tag-label.ts", "export default (key: string) => key.toUpperCase()\n")
    p.options.tags = true
    p.options.components = { tag: "app/blog/Tag.tsx" }
    p.options.tagLabel = "app/blog/tag-label.ts"
    const result = await preparePublication(p)
    expect(result.publication.tags?.[0].url).toBe("https://example.test/project/news/tags/design")
    const design = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(design).toContain('import * as view from "../../../../blog/Tag.tsx"')
    expect(design).toContain('import tagLabel from "../../../../blog/tag-label.ts"')
    expect(design).toContain("const site: PublicationTagModule = view")
    expect(design).toContain("const label: PublicationTagLabel = tagLabel")
    // The label and the default title are resolved when the page renders, not at build time.
    expect(design).toContain("const tagLabel = label(tag.key)")
    expect(design).toContain('{ title: tagLabel + " | News | Example" }')
    expect(design).toContain("site.meta({ publication, tag, label: tagLabel, posts, defaults })")
    expect(design).toContain(
      "<View publication={publication} tag={tag} label={label(tag.key)} posts={posts} />"
    )
    // Page data for the root comes from this tag, its label, and its posts when the page renders.
    expect(design).toContain("const siteFrontmatter = site.frontmatter")
    expect(design).toContain(
      "export const frontmatter = siteFrontmatter == null ? undefined : () => siteFrontmatter({ publication, tag, label: label(tag.key), posts })"
    )
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    expect(route.post).toMatchObject({
      publication: "default",
      tagLabel: `${p.root}/app/blog/tag-label.ts`,
      tagArchive: "/news/tags/",
    })
    const { code } = compilePost(route, p.config, p.routesDir)
    expect(code).toContain(
      `import _ardoTagLabel from ${JSON.stringify(`${p.root}/app/blog/tag-label.ts`)};`
    )
    expect(code).toContain('const _ardoTagArchive = "/news/tags/";')
  })

  it("shows tag keys without a tagLabel module", async () => {
    const p = await project()
    await p.write("first", "tags: [design]\n")
    p.options.tags = true
    const result = await preparePublication(p)
    const design = routeAt(result.routes, "app/routes/news/tags/design/index.tsx").content
    expect(design).toContain("const label = (key: string) => key")
    expect(design).not.toContain("import tagLabel")
    const { code } = compilePost(
      routeAt(result.routes, "app/routes/news/first/index.md"),
      p.config,
      p.routesDir
    )
    expect(code).toContain("const _ardoTagLabel = undefined;")
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
