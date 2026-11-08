import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { assertDevSSR, assertPreviewSSR } from "./dev-server"
import { createTestProject } from "./project"

// The layout guide's fully custom shell: no ArdoRoot, so no ArdoProvider and no sidebar context.
describe("Markdown and publications in a custom shell", () => {
  const directory = fs.realpathSync(createTestProject("custom-shell"))
  const output = path.join(directory, "build/client")
  const read = (relative: string) => fs.readFileSync(path.join(output, relative), "utf8")
  afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))

  beforeAll(() => {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  }, 180_000)

  it("prerenders Markdown pages in a plain content container inside the site's shell", () => {
    const notes = read("notes/index.html")
    expect(notes).toContain('<main data-shell="custom">')
    expect(notes).toMatch(
      /<div class="ardo-markdown [^"]+"><p>A Markdown page renders without ArdoRoot/u
    )
    expect(notes).toContain("<title>Field notes | Custom shell example</title>")
    expect(notes).toContain('href="/news/"')
    expect(notes).not.toContain("ardo-doc-page")
    // MDX guides from the Basic example render the same way.
    expect(read("guide/getting-started/index.html")).toContain("ardo-markdown")
  })

  it("prerenders a Markdown post with Ardo's frame, tag links, and feed links", () => {
    const post = read("news/hello/index.html")
    expect(post).toContain('<main data-shell="custom">')
    expect(post).toContain("ardo-post-body")
    expect(post).toContain("The post body is plain Markdown.")
    expect(post).toContain('<a rel="tag" href="/news/tags/design/">design</a>')
    expect(post).toContain('rel="alternate" type="application/atom+xml"')
    expect(read("news/index.html")).toContain("Hello from a custom shell")
    expect(read("news/tags/design/index.html")).toContain("Hello from a custom shell")
  })

  const counterpart = (html: string) => /<a data-counterpart="true" href="([^"]+)"/u.exec(html)?.[1]
  /** The scripts a page loads: its preloaded chunks and its module entry. */
  const scriptFiles = (html: string) => [
    ...new Set([...html.matchAll(/(?:src|href)="\/([^"]+\.js)"/gu)].map((match) => match[1])),
  ]
  const entryFile = (html: string) => /<script[^>]+src="\/([^"]+\.js)"/u.exec(html)?.[1]
  const scripts = (html: string) =>
    scriptFiles(html).map((file) => fs.readFileSync(path.join(output, file), "utf8"))

  it("lets the root read a page's custom frontmatter from that page's route only", () => {
    expect(counterpart(read("notes/index.html"))).toBe("https://de.example.test/notizen")
    const post = read("news/hello/index.html")
    expect(counterpart(post)).toBe("https://de.example.test/journal/hallo")
    // The value ships with the post's own route chunk, not with the listing's scripts.
    expect(scripts(post).some((code) => code.includes("de.example.test/journal/hallo"))).toBe(true)
    for (const code of scripts(read("news/index.html")))
      expect(code).not.toContain("de.example.test/journal/hallo")
  })

  it("lets the root read page data that the index and tag modules compute for their route", () => {
    expect(counterpart(read("news/index.html"))).toBe("https://de.example.test/journal?posts=2")
    const design = read("news/tags/design/index.html")
    const process = read("news/tags/process/index.html")
    expect(counterpart(design)).toBe("https://de.example.test/journal/schlagworte/design?posts=1")
    expect(counterpart(process)).toBe("https://de.example.test/journal/schlagworte/process?posts=1")
    expect(design).toContain("Hello from a custom shell")
    expect(design).not.toContain("How the journal is made")

    // Ardo serializes no page data into a chunk: each value is computed while the page renders,
    // from the tag that only that archive's route chunk holds.
    const designOnly = scriptFiles(design).filter((file) => !scriptFiles(process).includes(file))
    const designRoute = designOnly
      .map((file) => fs.readFileSync(path.join(output, file), "utf8"))
      .filter((code) => code.includes("Object.freeze({key:`design`"))
    expect(designRoute).toHaveLength(1)
    const entry = entryFile(design)
    expect(entry).toMatch(/entry-client/u)
    expect(designOnly).not.toContain(entry)
    for (const file of fs.readdirSync(path.join(output, "assets"))) {
      const code = fs.readFileSync(path.join(output, "assets", file), "utf8")
      expect(code).not.toContain("schlagworte/design")
      expect(code).not.toContain("schlagworte/process")
    }
    for (const code of scripts(process)) expect(code).not.toContain("Object.freeze({key:`design`")
  })

  it("renders the same pages in development and preview", async () => {
    const pages = [
      {
        pathname: "/notes/",
        contains: ["A Markdown page renders without ArdoRoot", "ardo-markdown"],
      },
      {
        pathname: "/news/hello/",
        contains: ["The post body is plain Markdown.", "https://de.example.test/journal/hallo"],
      },
      {
        pathname: "/news/tags/process/",
        contains: ["How the journal is made", "journal/schlagworte/process?posts=1"],
      },
    ]
    await assertDevSSR(directory, { pathname: "/", pages })
    await assertPreviewSSR(directory, { pathname: "/", pages })
  }, 180_000)
})
