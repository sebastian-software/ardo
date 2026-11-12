import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { transformWithOxc } from "vite"
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

type CompiledRoute = { filePath: string; content: string; post?: PublicationPostBinding }

function compileRouteModule(route: CompiledRoute) {
  return compileMdxRouteModule({
    source: route.content,
    markdownConfig: undefined,
    format: route.filePath.endsWith(".mdx") ? "mdx" : "md",
    id: route.filePath,
    publicationPost: route.post,
  })
}

function withPostMeta(
  compiled: string,
  route: CompiledRoute,
  site: { config: ReturnType<typeof resolveConfig>; routesDir: string }
) {
  const withMeta = transformMarkdownMeta(compiled, route.filePath, {
    routesDir: site.routesDir,
    resolvedConfig: site.config,
    publicationPost: (file) => (file === route.filePath ? route.post : undefined),
  })?.code
  return { compiled, code: withMeta ?? compiled }
}

/** Compile a generated post route the way the Vite plugin does, with its binding. */
function compilePost(
  route: CompiledRoute,
  config: ReturnType<typeof resolveConfig>,
  routesDir: string
) {
  return withPostMeta(compileRouteModule(route).code, route, { config, routesDir })
}

/** {@link compilePost} with the JSX transform that mdx-plugin runs before the metadata. */
async function compilePostWithOxc(
  route: CompiledRoute,
  config: ReturnType<typeof resolveConfig>,
  routesDir: string
) {
  const module = compileRouteModule(route)
  const transformed = await transformWithOxc(
    module.code,
    route.filePath,
    { jsx: { runtime: "automatic" }, lang: "jsx", sourcemap: true, sourceType: "module" },
    module.map
  )
  return withPostMeta(transformed.code, route, { config, routesDir })
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

/** The `BlogPosting` entries and the page metadata a compiled post route carries. */
function postMeta(code: string) {
  const entries = [...code.matchAll(/\{ "script:ld\+json": (\{.*?\}) \}/gu)].map(
    (match) => JSON.parse(match[1]) as Record<string, unknown>
  )
  const content = (pattern: RegExp) => pattern.exec(code)?.[1]
  return {
    entries,
    entry: entries[0],
    canonical: content(/\{ tagName: "link", rel: "canonical", href: ("[^"]*") \}/u),
    ogImage: content(/\{ property: "og:image", content: ("[^"]*") \}/u),
    description: content(/\{ name: "description", content: ("[^"]*") \}/u),
  }
}

const unquote = (value: string | undefined) =>
  value == null ? undefined : (JSON.parse(value) as string)

/** A post with every frontmatter line given, so a test can choose authors and dates itself. */
async function post(
  p: Awaited<ReturnType<typeof project>>,
  lines: string[] = [],
  overrides: { authors?: string; name?: string; body?: string; format?: "md" | "mdx" } = {}
) {
  const name = overrides.name ?? "first"
  const format = overrides.format ?? "md"
  await fs.writeFile(
    path.join(p.root, "posts", `${name}.${format}`),
    `---\nid: ${name}\ntitle: ${name}\npublishedAt: 2026-01-02T10:00:00Z\nauthors: ${overrides.authors ?? "[alex]"}\n${lines.map((line) => `${line}\n`).join("")}---\n${overrides.body ?? "A complete article.\n"}`
  )
  const result = await preparePublication(p)
  const route = routeAt(result.routes, `app/routes/news/${name}/index.${format}`)
  const published = result.publication.posts.find((entry) => entry.id === name)
  const { code } = compilePost(route, p.config, p.routesDir)
  return { result, published, code, ...postMeta(code) }
}

describe("publication post structured data", () => {
  it("describes a full post with its authors, dates, share image, and the site", async () => {
    const p = await project({ lang: "de-DE" })
    p.options.authors = {
      alex: { name: "Alex", url: "https://people.example.test/alex" },
    }
    const { entries, entry, published, canonical } = await post(p, [
      "description: Summary",
      "updatedAt: 2026-02-03T10:00:00Z",
      "ogImage: https://cdn.example.test/card.png",
    ])
    expect(entries).toHaveLength(1)
    expect(entry).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "first",
      description: "Summary",
      mainEntityOfPage: "https://example.test/project/news/first",
      inLanguage: "de-DE",
      datePublished: published?.publishedAt,
      dateModified: published?.updatedAt,
      author: [{ "@type": "Person", name: "Alex", url: "https://people.example.test/alex" }],
      image: "https://cdn.example.test/card.png",
      isPartOf: { "@type": "WebSite", name: "Example", url: "https://example.test/project/" },
    })
    expect(Object.keys(entry)).toStrictEqual([
      "@context",
      "@type",
      "headline",
      "description",
      "mainEntityOfPage",
      "inLanguage",
      "datePublished",
      "dateModified",
      "author",
      "image",
      "isPartOf",
    ])
    expect(published?.updatedAt).toBeDefined()
    expect(entry.mainEntityOfPage).toBe(unquote(canonical))
  })

  it("replaces the TechArticle and keeps the feed links in the defaults", async () => {
    const p = await project()
    await p.write("first")
    const result = await preparePublication(p)
    const { code } = compilePost(
      routeAt(result.routes, "app/routes/news/first/index.md"),
      p.config,
      p.routesDir
    )
    expect(code).toContain('"@type":"BlogPosting"')
    expect(code).not.toContain('"TechArticle"')
    expect(code).toContain('"rel":"alternate","type":"application/atom+xml"')
    expect(code.match(/script:ld\+json/gu)).toHaveLength(1)
  })

  it("sets dateModified exactly when the post sets updatedAt, and equal to it", async () => {
    const p = await project()
    const without = await post(p)
    expect(without.entry).not.toHaveProperty("dateModified")
    const withDate = await post(p, ["updatedAt: 2026-02-03T10:00:00Z"])
    expect(withDate.published?.updatedAt).toBeDefined()
    expect(withDate.entry.dateModified).toBe(withDate.published?.updatedAt)
    const same = await post(p, ["updatedAt: 2026-01-02T10:00:00Z"])
    expect(same.entry.dateModified).toBe(same.entry.datePublished)
  })

  it("takes the description only from the post, and never shows an author bio as the page's", async () => {
    const p = await project({ description: "Site description" })
    p.options.authors = { alex: { name: "Alex", description: "Alex writes about readable pages." } }
    const without = await post(p)
    expect(without.entry).not.toHaveProperty("description")
    expect(without.description).toBe(JSON.stringify("Site description"))
    // The module still nests the bio in the post data; the generated `meta` must not use it.
    expect(without.code.split("export const meta")[1]).not.toContain("Alex writes")
    const withOwn = await post(p, ["description: The post's summary"])
    expect(withOwn.entry.description).toBe("The post's summary")
    expect(unquote(withOwn.description)).toBe("The post's summary")
  })

  it.each([
    ["md", "a code block", '```ts\nexport const frontmatter = { title: "X" }\n```\n'],
    ["mdx", "a code block", '```ts\nexport const frontmatter = { title: "X" }\n```\n'],
    [
      "md",
      "inline code",
      "Use `export const frontmatter` as in [the guide](https://example.test).\n",
    ],
    [
      "mdx",
      "inline code",
      "Use `export const frontmatter` as in [the guide](https://example.test).\n",
    ],
  ] as const)(
    "keeps the metadata of a %s post that shows export const frontmatter in %s",
    async (format, _where, body) => {
      const p = await project()
      const { code, entry, canonical, description } = await post(p, ["description: Summary"], {
        body,
        format,
      })
      expect(code).toContain(
        'export const meta = () => _ardoPostMeta([{ title: "first | Example" }'
      )
      expect(unquote(description)).toBe("Summary")
      expect(unquote(canonical)).toBe("https://example.test/project/news/first")
      expect(entry).toMatchObject({
        "@type": "BlogPosting",
        headline: "first",
        description: "Summary",
        mainEntityOfPage: "https://example.test/project/news/first",
      })
    }
  )

  it("keeps the metadata of a post with such a code block after the plugin's JSX transform", async () => {
    const p = await project()
    await p.write(
      "first",
      "description: Summary\n",
      '```ts\nexport const frontmatter = { title: "X" }\n```'
    )
    const result = await preparePublication(p)
    const route = routeAt(result.routes, "app/routes/news/first/index.md")
    const { compiled, code } = await compilePostWithOxc(route, p.config, p.routesDir)
    // The transform prints Ardo's frontmatter object across indented lines.
    expect(compiled).toMatch(/\nconst _ardoFrontmatter = \{\n\t/u)
    const { entry, canonical, description } = postMeta(code)
    expect(code).toContain('export const meta = () => _ardoPostMeta([{ title: "first | Example" }')
    expect(unquote(description)).toBe("Summary")
    expect(unquote(canonical)).toBe("https://example.test/project/news/first")
    expect(entry).toMatchObject({
      "@type": "BlogPosting",
      headline: "first",
      description: "Summary",
    })
  })

  it("lists every author as a Person in post order, with a url only where one is configured", async () => {
    const p = await project()
    p.options.authors = {
      alex: { name: "Alex" },
      sam: { name: "Sam", url: "https://people.example.test/sam" },
    }
    const { entry } = await post(p, [], { authors: "[sam, alex]" })
    expect(entry.author).toStrictEqual([
      { "@type": "Person", name: "Sam", url: "https://people.example.test/sam" },
      { "@type": "Person", name: "Alex" },
    ])
  })

  it("leaves an invalid author url out of the structured data and keeps it on the profile", async () => {
    const p = await project()
    p.options.authors = {
      alex: { name: "Alex", url: "/people/alex" },
      sam: { name: "Sam", url: "https:people.example.test" },
      kim: { name: "Kim", url: "https://people.example.test/kim" },
    }
    const { entry, published } = await post(p, [], { authors: "[alex, sam, kim]" })
    expect(entry.author).toStrictEqual([
      { "@type": "Person", name: "Alex" },
      { "@type": "Person", name: "Sam" },
      { "@type": "Person", name: "Kim", url: "https://people.example.test/kim" },
    ])
    // The UI and Atom keep reading the configured value.
    expect(published?.authors.map((author) => author.url)).toStrictEqual([
      "/people/alex",
      "https:people.example.test",
      "https://people.example.test/kim",
    ])
  })

  it("uses the cover as image when the post has no share image, equal to og:image", async () => {
    const p = await project({ metadata: { image: "/social.png" } })
    await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#e64136" } })
      .png()
      .toFile(path.join(p.root, "posts/photo.png"))
    const { entry, ogImage } = await post(p, [
      "coverImage:",
      "  src: ./photo.png",
      "  alt: A scene",
    ])
    expect(typeof entry.image).toBe("string")
    expect(entry.image).toMatch(/^https:\/\/example\.test\/project\/assets\/posts\/.+\.jpg$/u)
    expect(entry.image).toBe(unquote(ogImage))
  })

  it("prefers an authored share image to the cover, and names no image from the site default alone", async () => {
    const p = await project({ metadata: { image: "/social.png" } })
    const plain = await post(p)
    // og:image falls back to the site-wide image; the post has none of its own.
    expect(unquote(plain.ogImage)).toBe("https://example.test/social.png")
    expect(plain.entry).not.toHaveProperty("image")
    const own = await post(p, ["ogImage: https://cdn.example.test/card.png"])
    expect(own.entry.image).toBe("https://cdn.example.test/card.png")
    expect(own.entry.image).toBe(unquote(own.ogImage))
  })

  it.each([
    {
      setting: "unset",
      site: {},
      canonicalUrl: "https://example.test/project/news/first",
      postUrl: "https://example.test/project/news/first/",
    },
    {
      setting: "true",
      site: { trailingSlash: true },
      canonicalUrl: "https://example.test/project/news/first/",
      postUrl: "https://example.test/project/news/first/",
    },
    {
      setting: "false",
      site: { trailingSlash: false },
      canonicalUrl: "https://example.test/project/news/first",
      postUrl: "https://example.test/project/news/first",
    },
  ])(
    "points mainEntityOfPage at the rendered canonical with trailingSlash $setting",
    async ({ site, canonicalUrl, postUrl }) => {
      const { entry, canonical, published } = await post(await project(site))
      expect(unquote(canonical)).toBe(canonicalUrl)
      expect(entry.mainEntityOfPage).toBe(canonicalUrl)
      // Without the setting, the post's own URL keeps the slash that the canonical omits.
      expect(published?.url).toBe(postUrl)
    }
  )

  it("points mainEntityOfPage at an authored canonical", async () => {
    const p = await project()
    const authored = await post(p, ["canonical: https://elsewhere.example.test/original"])
    expect(unquote(authored.canonical)).toBe("https://elsewhere.example.test/original")
    expect(authored.entry.mainEntityOfPage).toBe("https://elsewhere.example.test/original")
  })

  it("is absent with seo.jsonLd: false, while the feed links remain", async () => {
    const p = await project({ seo: { jsonLd: false } })
    await p.write("first")
    const result = await preparePublication(p)
    const { code } = compilePost(
      routeAt(result.routes, "app/routes/news/first/index.md"),
      p.config,
      p.routesDir
    )
    expect(code).not.toContain("script:ld+json")
    expect(code).not.toContain("BlogPosting")
    expect(code).not.toContain("TechArticle")
    expect(code).toContain('"rel":"alternate","type":"application/atom+xml"')
  })

  it("declares the site language, or the locale id of a localized publication", async () => {
    const p = await project({ lang: "fr-FR" })
    const site = await post(p)
    expect(site.entry.inLanguage).toBe("fr-FR")
    await fs.mkdir(path.join(p.root, "posts/de"))
    await fs.rename(path.join(p.root, "posts/first.md"), path.join(p.root, "posts/de/first.md"))
    p.config = resolveConfig(
      {
        title: "Example",
        siteUrl: "https://example.test",
        lang: "fr-FR",
        i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
      },
      p.root
    )
    const result = await preparePublication({ ...p, localeId: "de" })
    const { entry } = postMeta(
      compilePost(
        routeAt(result.routes, "app/routes/de/news/first/index.md"),
        p.config,
        p.routesDir
      ).code
    )
    expect(entry.inLanguage).toBe("de")
  })
})
