import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, expect, it } from "vitest"
import { createTestProject } from "./project"
import { assertDevSSR, assertPreviewSSR } from "./dev-server"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

it("builds a complete publication beside versioned documentation under a deployment base", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  const output = path.join(directory, "build/client")
  const home = fs.readFileSync(path.join(output, "index.html"), "utf8")
  const listing = fs.readFileSync(path.join(output, "news/index.html"), "utf8")
  const post = fs.readFileSync(path.join(output, "news/reading/index.html"), "utf8")
  const interactive = fs.readFileSync(path.join(output, "news/interactive/index.html"), "utf8")
  expect(home).not.toContain('http-equiv="refresh"')
  expect(fs.existsSync(path.join(output, "v2/guide/getting-started/index.html"))).toBe(true)
  expect(fs.existsSync(path.join(output, "v2/news"))).toBe(false)
  expect(fs.readFileSync(path.join(output, "v2/index.html"), "utf8")).toContain(
    "/project/v2/guide/getting-started/"
  )
  expect(fs.existsSync(path.join(output, "news/draft"))).toBe(false)
  expect(listing).toContain("Field notes")
  // Feed discovery links stay links; they carry a `title` attribute.
  expect(listing).toMatch(
    /<link rel="alternate" type="application\/atom\+xml"[^>]+title="Field notes"\/>/u
  )
  expect(listing.match(/<title>/gu)).toHaveLength(1)
  expect(post).toContain("Alex Morgan")
  expect(post).toContain("Sam Rivera")
  expect(post).toContain("<picture>")
  expect(post).toContain('type="image/avif"')
  expect(
    fs.readdirSync(path.join(output, "assets/posts")).map((file) => path.extname(file))
  ).toEqual(expect.arrayContaining([".avif", ".jpg"]))
  expect(
    fs.readdirSync(path.join(output, "assets/posts")).some((f) => /\.(?:jxl|webp)$/u.test(f))
  ).toBe(false)
  expect(post).toMatch(/<source[^>]+media="\(min-width: 52rem\)"[^>]+srcSet=/u)
  expect(post).toContain('href="/project/v2/guide/getting-started/"')
  expect(post).toContain('href="/project/"')
  expect(post).not.toContain('aria-label="Documentation version"')
  expect(post).toMatch(/<img[^>]+src="\/project\/assets\/posts\/[^"]+\.jpg"/u)
  expect(post).toMatch(/og:image[^>]+\.jpg/u)
  expect(interactive).toContain("Count: ")
  for (const name of ["atom.xml", "rss.xml"]) {
    const feed = fs.readFileSync(path.join(output, "news", name), "utf8")
    expect(feed).toContain("https://example.test/project/assets/posts/")
    expect(feed).toContain("The static version explains")
    expect(feed).toContain("urn:ardo:post:07137892-fca6-4699-a5ea-609c80dbf814")
    expect(feed).toContain(".jpg")
    expect(feed).not.toContain(".avif")
  }
  // Without trailingSlash, Ardo keeps its earlier spelling: listing and post URLs and links with
  // the slash, sitemap entries and the post's default canonical without it.
  expect(listing).toContain('<link rel="canonical" href="https://example.test/project/news/"/>')
  expect(post).toContain('<link rel="canonical" href="https://example.test/project/news/reading"/>')
  expect(fs.readFileSync(path.join(output, "news/atom.xml"), "utf8")).toContain(
    '<link href="https://example.test/project/news/reading/"/>'
  )
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("<loc>https://example.test/project/news/reading</loc>")
  expect(sitemap).toContain("https://example.test/project/v2/guide/getting-started")
  expect(sitemap).not.toContain("draft")
  const scan = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) scan(file)
      else if (/\.(?:js|html|xml|txt)$/u.test(entry.name))
        expect(fs.readFileSync(file, "utf8")).not.toContain("PRIVATE_DRAFT_BODY_MUST_NOT_SHIP")
    }
  }
  scan(output)
})

/** Every JavaScript file an HTML page loads or preloads. */
function pageScripts(output: string, html: string): string[] {
  return [...html.matchAll(/(?:src|href)="\/project\/([^"]+\.js)"/gu)].map((match) =>
    fs.readFileSync(path.join(output, match[1]), "utf8")
  )
}

it("builds a site-designed publication from route modules, with labels and one URL spelling", async () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  const reading = path.join(directory, "posts/reading.mdx")
  fs.writeFileSync(
    reading,
    fs
      .readFileSync(reading, "utf8")
      .replace("tags: [Design, Engineering]", "tags: [design]\nnextStep: https://contact.example/")
  )
  fs.mkdirSync(path.join(directory, "app/blog"))
  fs.writeFileSync(
    path.join(directory, "app/blog/Overview.tsx"),
    `import type { PublicationIndexMetaArgs, PublicationIndexProps } from "ardo/config"
export default function Overview({ publication }: PublicationIndexProps) {
  return <main data-site="overview">{publication.posts.map((post) => <a key={post.id} href={post.url}>{post.title}</a>)}</main>
}
export function meta({ publication, defaults }: PublicationIndexMetaArgs) {
  return [{ title: "Site blog" }, ...defaults.filter((entry) => "tagName" in entry || !("title" in entry)), { name: "posts", content: String(publication.posts.length) }]
}
`
  )
  fs.writeFileSync(
    path.join(directory, "app/blog/Post.tsx"),
    `import type { PublicationPostMetaArgs, PublicationPostProps } from "ardo/config"
import { useArdoPublicationTags } from "ardo/ui"
export default function SitePost({ post, children }: PublicationPostProps) {
  const tags = useArdoPublicationTags()
  const next = typeof post.data.nextStep === "string" ? post.data.nextStep : undefined
  return <article data-site="post"><h1>{post.title}</h1>{children}<p data-marker="SITE_POST_FRAME_MARKER">{post.tags.map(tags.label).join(", ")}</p>{next && <a data-next href={next}>Next</a>}</article>
}
export const meta = ({ post, publication, defaults }: PublicationPostMetaArgs) => [
  { title: post.title + " · " + publication.name },
  ...defaults.filter((entry) => "tagName" in entry && (entry.rel === "canonical" || entry.rel === "alternate")),
  { property: "og:type", content: "article" },
  { name: "next-step", content: String(post.data.nextStep) },
]
`
  )
  // No meta export: the archive keeps Ardo's metadata, titled with the label.
  fs.writeFileSync(
    path.join(directory, "app/blog/Tag.tsx"),
    `import type { Post, PublicationTagMetaArgs, PublicationTagProps } from "ardo/config"
export default function Tag({ label, posts }: PublicationTagProps) {
  return <main data-site="tag"><h1>{label}</h1>{posts.map((post) => <a key={post.id} href={post.url}>{post.title}</a>)}</main>
}
// The spike's bug: sorting the shared posts in meta reordered the index. The data is frozen.
export function meta({ publication, defaults }: PublicationTagMetaArgs) {
  let mutation = "applied"
  try {
    ;(publication.posts as Post[]).sort((left, right) => left.title.localeCompare(right.title))
  } catch {
    mutation = "blocked"
  }
  return [...defaults, { name: "mutation", content: mutation }]
}
`
  )
  fs.writeFileSync(
    path.join(directory, "app/blog/tag-label.ts"),
    `import type { PublicationTagLabel } from "ardo/config"
const labels: Record<string, string> = { design: "Gestaltung" }
const tagLabel: PublicationTagLabel = (key) => labels[key] ?? key
export default tagLabel
`
  )
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        'title: "Publication example",\n  trailingSlash: false,'
      )
      .replace(
        "publication: {",
        `publication: {
    tags: true,
    feeds: { entryIds: "publication" },
    components: { index: "app/blog/Overview.tsx", post: "app/blog/Post.tsx", tag: "app/blog/Tag.tsx" },
    tagLabel: "app/blog/tag-label.ts",`
      )
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  // Generated routes and the site's route modules pass strict TypeScript.
  try {
    execFileSync(
      "pnpm",
      ["--config.verifyDepsBeforeRun=false", "exec", "tsc", "--noEmit", "-p", "tsconfig.json"],
      { cwd: directory, stdio: "pipe", timeout: 120_000 }
    )
  } catch (error) {
    throw new Error(String((error as { stdout?: Buffer }).stdout ?? error), { cause: error })
  }
  const tagRoute = fs.readFileSync(
    path.join(directory, "app/routes/news/tags/design/index.tsx"),
    "utf8"
  )
  // The label is resolved while the page renders, not written into the route.
  expect(tagRoute).not.toContain("Gestaltung")
  const output = path.join(directory, "build/client")
  const canonicals = (html: string) =>
    [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/gu)].map((match) => match[0])
  const listing = fs.readFileSync(path.join(output, "news/index.html"), "utf8")
  expect(listing).toContain('data-site="overview"')
  expect(listing).toContain("<title>Site blog</title>")
  expect(listing).toContain('<meta name="posts" content="2"/>')
  expect(listing).toContain('type="application/atom+xml"')
  expect(canonicals(listing)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news"/>',
  ])
  const post = fs.readFileSync(path.join(output, "news/reading/index.html"), "utf8")
  expect(post).toContain('data-site="post"')
  expect(post).toContain("A good article gives its reader room to think.")
  expect(post).toContain(">Gestaltung</p>")
  expect(post).not.toContain("ardo-post-body")
  expect(post).toContain("<title>Designing for a clearer reading experience · Field notes</title>")
  expect(canonicals(post)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news/reading"/>',
  ])
  expect(post).not.toContain("og:url")
  expect(post).not.toContain("twitter:card")
  // Internal links follow the site's spelling too.
  expect(post).toContain('href="/project/v2/guide/getting-started"')
  expect(post).not.toContain('href="/project/v2/guide/getting-started/"')
  const tag = fs.readFileSync(path.join(output, "news/tags/design/index.html"), "utf8")
  expect(tag).toContain('data-site="tag"')
  expect(tag).toContain("<h1>Gestaltung</h1>")
  expect(tag).toContain("<title>Gestaltung | Field notes | Publication example</title>")
  expect(tag).toContain("Designing for a clearer reading experience")
  expect(tag).not.toContain("An example that responds")
  expect(canonicals(tag)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news/tags/design"/>',
  ])
  // The post module's defaults carry the feed links, like the index and tag defaults.
  expect(post).toMatch(
    /<link rel="alternate" type="application\/atom\+xml"[^>]+title="Field notes"\/>/u
  )
  // Custom frontmatter reaches the post module as post.data.
  expect(post).toContain('<a data-next="true" href="https://contact.example/">Next</a>')
  expect(post).toContain('<meta name="next-step" content="https://contact.example/"/>')
  // A mutation of the shared data in a tag's meta is blocked and leaves the index order intact.
  expect(tag).toContain('<meta name="mutation" content="blocked"/>')
  const order = [
    ...listing.matchAll(/<a href="https:\/\/example\.test\/project\/news\/([^"]+)"/gu),
  ].map((match) => match[1])
  expect(order).toStrictEqual(["reading", "interactive"])
  // Only post routes load the post frame; a documentation page does not.
  const guide = fs.readFileSync(path.join(output, "v2/guide/getting-started/index.html"), "utf8")
  expect(pageScripts(output, post).some((code) => code.includes("SITE_POST_FRAME_MARKER"))).toBe(
    true
  )
  for (const code of pageScripts(output, guide)) {
    expect(code).not.toContain("SITE_POST_FRAME_MARKER")
    expect(code).not.toContain("ardo-post-body")
  }
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("<loc>https://example.test/project/news/tags/design</loc>")
  expect(sitemap).toContain("<loc>https://example.test/project/news/reading</loc>")
  expect(sitemap).toContain("<loc>https://example.test/project/news</loc>")
  expect(sitemap).toContain("<loc>https://example.test/project/</loc>")
  const atom = fs.readFileSync(path.join(output, "news/atom.xml"), "utf8")
  expect(atom).toContain('xml:lang="en"')
  expect(atom).toContain('<link href="https://example.test/project/news"/>')
  expect(atom).toContain('<link href="https://example.test/project/news/reading"/>')
  expect(atom).toContain(
    "<id>urn:ardo:publication:example.test/project/news:post:07137892-fca6-4699-a5ea-609c80dbf814</id>"
  )
  // Feeds keep the stable key; they are built without an active locale.
  expect(atom).toContain('<category term="design"/>')
  expect(fs.readFileSync(path.join(output, "news/rss.xml"), "utf8")).toContain(
    "<language>en</language>"
  )
  // Dev and preview send the other spelling of a page to the configured one.
  const expectation = {
    pathname: "/project/",
    pages: [{ pathname: "/project/news/tags/design", contains: ["Gestaltung"] }],
    redirects: [
      { pathname: "/project/news/reading/", location: "/project/news/reading" },
      { pathname: "/project/news/tags/design/?q=1", location: "/project/news/tags/design?q=1" },
    ],
  }
  await assertDevSSR(directory, {
    ...expectation,
    redirects: expectation.redirects.map((entry) => ({ ...entry, status: 302 })),
  })
  await assertPreviewSSR(directory, {
    ...expectation,
    redirects: expectation.redirects.map((entry) => ({ ...entry, status: 301 })),
  })
}, 240_000)

it("rejects publication sources in publicDir before Vite can copy draft bodies", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  fs.mkdirSync(path.join(directory, "public"), { recursive: true })
  fs.renameSync(path.join(directory, "posts"), path.join(directory, "public/posts"))
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs.readFileSync(config, "utf8").replace('from: "posts"', 'from: "public/posts"')
  )
  expect(() =>
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  ).toThrow("publicDir")
  expect(fs.existsSync(path.join(directory, "build/client/posts/draft.md"))).toBe(false)
})

it("keeps React SSR working after a colocated image triggers publication regeneration", async () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  await assertDevSSR(directory, {
    pathname: "/project/news/interactive/",
    afterFirstResponse: async ({ origin }) => {
      const before = await fetch(`${origin}/project/news/reading/`)
      expect(before.status).toBe(200)
      const html = await before.text()
      const avif = /srcSet="([^"\s,]+\.avif) \d+w/u.exec(html)?.[1]
      const jpeg = /<img[^>]+src="([^"]+\.jpg)"/u.exec(html)?.[1]
      expect(avif).toBeDefined()
      expect(jpeg).toBeDefined()
      const avifResponse = await fetch(`${origin}${avif}`, { method: "HEAD" })
      const jpegResponse = await fetch(`${origin}${jpeg}`, { method: "HEAD" })
      expect(avifResponse.status).toBe(200)
      expect(jpegResponse.status).toBe(200)
      expect(avifResponse.headers.get("content-type")).toBe("image/avif")
      expect(jpegResponse.headers.get("content-type")).toBe("image/jpeg")
      const route = path.join(directory, "app/routes/news/reading/index.mdx")
      const image = path.join(directory, "posts/scene.png")
      for (let update = 0; update < 3; update++) {
        // The route keeps its post's date as mtime; a rewrite still advances its ctime.
        const timestamp = fs.statSync(route).ctimeMs
        fs.writeFileSync(image, fs.readFileSync(image))
        await expect
          .poll(() => fs.statSync(route).ctimeMs, { timeout: 10_000 })
          .toBeGreaterThan(timestamp)
        const after = await fetch(`${origin}/project/news/reading/`)
        expect(after.status).toBe(200)
        expect(await after.text()).toContain("Designing for a clearer reading experience")
        const index = await fetch(`${origin}/project/news/`)
        expect(index.status).toBe(200)
        expect(await index.text()).toContain("Field notes")
      }
    },
  })
})

it("builds localized site/news paths and versioned documentation with matching locale links", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  for (const relative of ["app/routes", "posts"]) {
    const original = path.join(directory, `${relative}-original`)
    const target = path.join(directory, relative)
    fs.renameSync(target, original)
    for (const locale of ["en", "de"])
      fs.cpSync(original, path.join(target, locale), { recursive: true })
    fs.rmSync(original, { recursive: true })
  }
  for (const locale of ["en", "de"]) {
    const home = path.join(directory, "app/routes", locale, "home.tsx")
    fs.writeFileSync(home, fs.readFileSync(home, "utf8").replace('"../Counter"', '"../../Counter"'))
  }
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        "versioning: {",
        'i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },\nversioning: {'
      )
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  const output = path.join(directory, "build/client")
  const post = fs.readFileSync(path.join(output, "de/news/reading/index.html"), "utf8")
  expect(post).toContain('lang="de"')
  expect(post).toContain('hrefLang="en" href="https://example.test/project/en/news/reading"')
  expect(post).toContain('href="/project/de/"')
  expect(post).toContain('href="/project/v2/de/guide/getting-started/"')
  const guide = fs.readFileSync(path.join(output, "v2/de/guide/getting-started/index.html"), "utf8")
  expect(guide).toContain('lang="de"')
  expect(guide).toContain(
    'hrefLang="en" href="https://example.test/project/v2/en/guide/getting-started"'
  )
  expect(fs.readFileSync(path.join(output, "index.html"), "utf8")).toContain("/project/en/")
  expect(fs.readFileSync(path.join(output, "de/news/atom.xml"), "utf8")).toContain(
    "https://example.test/project/v2/de/guide/getting-started/"
  )
})

it("builds the publication at a pinned buildTime across pages, tags, feeds, sitemap and client", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  // "reading" (2026-10-20) is scheduled after the pinned moment, "interactive" (2026-10-10) before.
  const reading = path.join(directory, "posts/reading.mdx")
  fs.writeFileSync(
    reading,
    fs
      .readFileSync(reading, "utf8")
      .replace("tags: [Design, Engineering]", "tags: [design, engineering]")
  )
  const interactive = path.join(directory, "posts/interactive.mdx")
  fs.writeFileSync(
    interactive,
    fs
      .readFileSync(interactive, "utf8")
      .replace(
        "publishedAt: 2026-10-10T09:00:00Z",
        "publishedAt: 2026-10-10T09:00:00Z\ntags: [engineering]"
      )
  )
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        'title: "Publication example",\n  buildTime: "2026-10-15T00:00:00Z",'
      )
      .replace("publication: {", "publication: {\n    tags: true,")
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  const output = path.join(directory, "build/client")
  expect(fs.existsSync(path.join(output, "news/interactive/index.html"))).toBe(true)
  expect(fs.existsSync(path.join(output, "news/reading"))).toBe(false)
  const listing = fs.readFileSync(path.join(output, "news/index.html"), "utf8")
  expect(listing).not.toContain("news/reading")
  // ArdoFooter prints the pinned date in UTC with the site locale "en"; React separates the
  // adjacent text parts of that line with empty comments.
  expect(listing.replaceAll("<!-- -->", "")).toContain("Built on October 15, 2026")
  for (const name of ["atom.xml", "rss.xml"]) {
    const feed = fs.readFileSync(path.join(output, "news", name), "utf8")
    expect(feed).toContain("urn:ardo:post:")
    expect(feed).not.toContain("designing-for-a-clearer-reading-experience")
    expect(feed).not.toContain("Designing for a clearer reading experience")
  }
  // Tag archives list visible posts only; a tag used only by the scheduled post has none.
  expect(fs.existsSync(path.join(output, "news/tags/design"))).toBe(false)
  const engineering = fs.readFileSync(path.join(output, "news/tags/engineering/index.html"), "utf8")
  expect(engineering).toContain("An example that responds")
  expect(engineering).not.toContain("news/reading")
  // Feed timestamps come from the visible posts, never from the build's clock.
  const atom = fs.readFileSync(path.join(output, "news/atom.xml"), "utf8")
  const updated = [...atom.matchAll(/<(?:updated|published)>([^<]+)</gu)].map((match) =>
    new Date(match[1]).toISOString()
  )
  expect(new Set(updated)).toStrictEqual(new Set(["2026-10-10T09:00:00.000Z"]))
  const rss = fs.readFileSync(path.join(output, "news/rss.xml"), "utf8")
  expect(rss).not.toContain("lastBuildDate")
  expect([...rss.matchAll(/<pubDate>([^<]+)</gu)].map((match) => match[1])).toStrictEqual([
    "Sat, 10 Oct 2026 09:00:00 GMT",
  ])
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("https://example.test/project/news/interactive")
  expect(sitemap).not.toContain("news/reading")
  expect(sitemap).not.toContain("news/tags/design")
  // Generated listings take their lastmod from their newest visible post, not the build's clock.
  const lastmod = (loc: string) =>
    new RegExp(`<loc>${loc}</loc>\\s*<lastmod>([^<]+)</lastmod>`, "u").exec(sitemap)?.[1]
  for (const loc of [
    "https://example.test/project/news",
    "https://example.test/project/news/interactive",
    "https://example.test/project/news/tags/engineering",
  ])
    expect(lastmod(loc), loc).toBe("2026-10-10T09:00:00.000Z")
  const carriers: string[] = []
  const scan = (target: string): void => {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const file = path.join(target, entry.name)
      if (entry.isDirectory()) scan(file)
      else if (
        entry.name.endsWith(".js") &&
        fs.readFileSync(file, "utf8").includes("2026-10-15T00:00:00.000Z")
      )
        carriers.push(path.relative(output, file))
    }
  }
  scan(output)
  expect(carriers).not.toHaveLength(0)
})
