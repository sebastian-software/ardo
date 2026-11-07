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

it("builds the publication at a pinned buildTime across pages, feeds, sitemap and client", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        'title: "Publication example",\n  buildTime: "2026-10-15T00:00:00Z",'
      )
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
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8")
  expect(sitemap).toContain("https://example.test/project/news/interactive")
  expect(sitemap).not.toContain("news/reading")
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
