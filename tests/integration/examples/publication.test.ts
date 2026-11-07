import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, expect, it } from "vitest"
import { createTestProject } from "./project"
import { assertDevSSR } from "./dev-server"

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
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("https://example.test/project/news/reading")
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

it("builds a site-designed publication with tag archives, own metadata, and no trailing slashes", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  const reading = path.join(directory, "posts/reading.mdx")
  fs.writeFileSync(
    reading,
    fs.readFileSync(reading, "utf8").replace("tags: [Design, Engineering]", "tags: [design]")
  )
  fs.mkdirSync(path.join(directory, "app/blog"))
  fs.writeFileSync(
    path.join(directory, "app/blog/Overview.tsx"),
    'import type { PublicationIndexProps } from "ardo/config"\nexport default function Overview({ publication }: PublicationIndexProps) {\n  return <main data-site="overview">{publication.posts.map((post) => <a key={post.id} href={post.url}>{post.title}</a>)}</main>\n}\n'
  )
  fs.writeFileSync(
    path.join(directory, "app/blog/Post.tsx"),
    'import type { PublicationPostProps } from "ardo/config"\nexport default function SitePost({ post, children }: PublicationPostProps) {\n  return <article data-site="post"><h1>{post.title}</h1>{children}</article>\n}\n'
  )
  fs.writeFileSync(
    path.join(directory, "app/blog/Tag.tsx"),
    'import type { PublicationTagProps } from "ardo/config"\nconst labels: Record<string, string> = { design: "Gestaltung" }\nexport default function Tag({ tag, posts }: PublicationTagProps) {\n  return <main data-site="tag"><h1>{labels[tag.key]}</h1>{posts.map((post) => <a key={post.id} href={post.url}>{post.title}</a>)}</main>\n}\n'
  )
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs.readFileSync(config, "utf8").replace(
      "publication: {",
      `publication: {
    trailingSlash: false,
    tags: true,
    feeds: { entryIds: "publication" },
    components: { index: "app/blog/Overview.tsx", post: "app/blog/Post.tsx", tag: "app/blog/Tag.tsx" },
    meta: {
      index: ({ publication }) => [
        { title: "Site blog" },
        { tagName: "link", rel: "canonical", href: publication.url },
      ],
      post: ({ post }) => [
        { title: post.title + " · Site" },
        { tagName: "link", rel: "canonical", href: post.url },
        { property: "og:type", content: "article" },
      ],
      tag: ({ tag }) => [{ title: "Gestaltung · Site" }, { tagName: "link", rel: "canonical", href: tag.url }],
    },`
    )
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  // Generated routes, site components, and the config's metadata functions pass strict TypeScript.
  try {
    execFileSync(
      "pnpm",
      ["--config.verifyDepsBeforeRun=false", "exec", "tsc", "--noEmit", "-p", "tsconfig.json"],
      { cwd: directory, stdio: "pipe", timeout: 120_000 }
    )
  } catch (error) {
    throw new Error(String((error as { stdout?: Buffer }).stdout ?? error), { cause: error })
  }
  expect(fs.existsSync(path.join(directory, "app/routes/news/tags/design/index.tsx"))).toBe(true)
  const output = path.join(directory, "build/client")
  const canonicals = (html: string) =>
    [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/gu)].map((match) => match[0])
  const listing = fs.readFileSync(path.join(output, "news/index.html"), "utf8")
  expect(listing).toContain('data-site="overview"')
  expect(listing).toContain("<title>Site blog</title>")
  expect(canonicals(listing)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news"/>',
  ])
  const post = fs.readFileSync(path.join(output, "news/reading/index.html"), "utf8")
  expect(post).toContain('data-site="post"')
  expect(post).toContain("A good article gives its reader room to think.")
  expect(post).not.toContain("ardo-post-body")
  expect(post).toContain("<title>Designing for a clearer reading experience · Site</title>")
  expect(canonicals(post)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news/reading"/>',
  ])
  expect(post).not.toContain("og:url")
  expect(post).not.toContain("twitter:card")
  const tag = fs.readFileSync(path.join(output, "news/tags/design/index.html"), "utf8")
  expect(tag).toContain('data-site="tag"')
  expect(tag).toContain("Gestaltung")
  expect(tag).toContain("Designing for a clearer reading experience")
  expect(tag).not.toContain("An example that responds")
  expect(canonicals(tag)).toStrictEqual([
    '<link rel="canonical" href="https://example.test/project/news/tags/design"/>',
  ])
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("<loc>https://example.test/project/news/tags/design</loc>")
  const atom = fs.readFileSync(path.join(output, "news/atom.xml"), "utf8")
  expect(atom).toContain('xml:lang="en"')
  expect(atom).toContain('<link href="https://example.test/project/news/reading"/>')
  expect(atom).toContain(
    "<id>urn:ardo:publication:example.test/project/news:post:07137892-fca6-4699-a5ea-609c80dbf814</id>"
  )
  expect(atom).toContain('<category term="design"/>')
  expect(fs.readFileSync(path.join(output, "news/rss.xml"), "utf8")).toContain(
    "<language>en</language>"
  )
})

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
        const timestamp = fs.statSync(route).mtimeMs
        fs.writeFileSync(image, fs.readFileSync(image))
        await expect
          .poll(() => fs.statSync(route).mtimeMs, { timeout: 10_000 })
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
