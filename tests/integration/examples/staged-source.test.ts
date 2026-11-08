import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createTestProject } from "./project"

const COMMITTED = "2020-01-02T03:04:05.000Z"
const BUILD_TIME = "2026-06-01T00:00:00.000Z"

/** Every file of a build's client output, by its path relative to the output. */
type Output = Map<string, Buffer>

function readOutput(directory: string): Output {
  const files: Output = new Map()
  for (const entry of fs.readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const file = path.join(entry.parentPath, entry.name)
    files.set(path.relative(directory, file), fs.readFileSync(file))
  }
  return files
}

function lastmod(output: Output, loc: string): string | undefined {
  const sitemap = String(output.get("sitemap.xml"))
  return new RegExp(`<loc>${loc}</loc>\\s*<lastmod>([^<]+)</lastmod>`, "u").exec(sitemap)?.[1]
}

/** The route table's `lastUpdated` of a route file, from the client chunk that holds the table. */
function lastUpdated(output: Output, relativePath: string): number | undefined {
  // The minifier writes the table's strings as template literals.
  const pattern = new RegExp(
    `relativePath"?:["\`]${relativePath.replaceAll(".", "\\.")}["\`],"?lastUpdated"?:([\\d.e+]+)`,
    "u"
  )
  for (const [file, content] of output) {
    if (!file.endsWith(".js")) continue
    const match = pattern.exec(String(content))
    if (match != null) return Number(match[1])
  }
  return undefined
}

// The Software website builds each language from a copy of its project in an untracked
// directory. `sourceRoot` lets Ardo read the history of the project that the copy mirrors.
describe("builds from staged copies of a project", () => {
  const source = fs.realpathSync(createTestProject("custom-shell"))
  const stage = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ardo-stage-")))
  const outputs = new Map<string, Output>()

  function build(name: string, options: { sourceRoot?: string } = {}): Output {
    const site = path.join(stage, name)
    fs.rmSync(site, { recursive: true, force: true })
    // A fresh copy, as a staging build makes it: new file times, no Git directory.
    fs.cpSync(source, site, {
      recursive: true,
      filter: (file) => ![".git", "build"].includes(path.relative(source, file)),
    })
    const config = path.join(site, "ardo.config.ts")
    fs.writeFileSync(
      config,
      fs
        .readFileSync(config, "utf8")
        .replace(
          'title: "Custom shell example",',
          `title: "Custom shell example",\n  buildTime: ${JSON.stringify(BUILD_TIME)},${
            options.sourceRoot == null
              ? ""
              : `\n  sourceRoot: ${JSON.stringify(options.sourceRoot)},`
          }`
        )
    )
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
      cwd: site,
      stdio: "pipe",
      timeout: 120_000,
    })
    return readOutput(path.join(site, "build/client"))
  }

  beforeAll(() => {
    fs.writeFileSync(path.join(source, ".gitignore"), "node_modules\nbuild\napp/routes/news\n")
    const git = (args: string[]) =>
      execFileSync("git", args, {
        cwd: source,
        stdio: "ignore",
        env: { ...process.env, GIT_AUTHOR_DATE: COMMITTED, GIT_COMMITTER_DATE: COMMITTED },
      })
    git(["init", "--quiet"])
    git(["add", "."])
    git([
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      "Site",
    ])
    outputs.set("en", build("en", { sourceRoot: source }))
    // A relative sourceRoot resolves against the staged project's root.
    outputs.set("de", build("de", { sourceRoot: path.relative(path.join(stage, "de"), source) }))
    outputs.set("en again", build("en", { sourceRoot: source }))
    outputs.set("plain", build("plain"))
  }, 600_000)

  afterAll(() => {
    fs.rmSync(source, { recursive: true, force: true })
    fs.rmSync(stage, { recursive: true, force: true })
  })

  it("dates pages by the commit of the file that each copy mirrors", () => {
    for (const name of ["en", "de"]) {
      const output = outputs.get(name)
      if (output == null) throw new Error(`No ${name} build`)
      expect(lastmod(output, "https://example.test/notes")).toBe(COMMITTED)
      expect(lastmod(output, "https://example.test/guide/getting-started")).toBe(COMMITTED)
      expect(lastUpdated(output, "notes.md")).toBe(Date.parse(COMMITTED))
      expect(lastUpdated(output, "home.tsx")).toBe(Date.parse(COMMITTED))
      // Generated publication routes keep the dates of their posts.
      expect(lastmod(output, "https://example.test/news/hello")).toBe("2026-01-02T10:00:00.000Z")
    }
    expect(outputs.get("de")?.get("sitemap.xml")).toStrictEqual(
      outputs.get("en")?.get("sitemap.xml")
    )
  })

  it("produces byte-identical output for two builds at the same buildTime", () => {
    const first = outputs.get("en")
    const second = outputs.get("en again")
    expect([...(second?.keys() ?? [])].sort()).toStrictEqual([...(first?.keys() ?? [])].sort())
    const changed = [...(first ?? [])]
      .filter(([file, content]) => !content.equals(second?.get(file) ?? Buffer.alloc(0)))
      .map(([file]) => file)
    expect(changed).toStrictEqual([])
    expect(first?.has("sitemap.xml")).toBe(true)
    expect(first?.has("notes/index.html")).toBe(true)
  })

  it("keeps today's fallback without sourceRoot", () => {
    const plain = outputs.get("plain")
    if (plain == null) throw new Error("No plain build")
    // The copy's file times are after the pinned buildTime, which caps the sitemap date.
    expect(lastmod(plain, "https://example.test/notes")).toBe(BUILD_TIME)
    expect(lastUpdated(plain, "notes.md")).toBeGreaterThan(Date.parse(BUILD_TIME))
  })
})
