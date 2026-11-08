import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { createBuildOutputAssets } from "./build-outputs"
import { createRouteManifestOptions, scanRouteManifest } from "./route-manifest"
import { createRoutesModule } from "./routes-plugin"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

function temporaryDirectory(prefix: string): string {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)))
  directories.push(directory)
  return directory
}

const COMMITTED = Date.parse("2020-01-02T03:04:05Z")

function git(directory: string, args: string[]): void {
  execFileSync("git", args, {
    cwd: directory,
    stdio: "ignore",
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: "2020-01-02T03:04:05Z",
      GIT_COMMITTER_DATE: "2020-01-02T03:04:05Z",
    },
  })
}

function commitAll(directory: string): void {
  git(directory, ["init", "--quiet"])
  git(directory, ["add", "."])
  git(directory, [
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
    "Initial docs",
  ])
}

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

describe("route source metadata", () => {
  it("uses source-relative paths and commit dates, with file times for untracked pages", () => {
    const directory = temporaryDirectory("ardo-route-source-")
    const routesDir = path.join(directory, "app/routes")
    const source = path.join(routesDir, "guide/setup.mdx")
    write(source, "# Setup")
    commitAll(directory)
    fs.writeFileSync(path.join(routesDir, "home.md"), "# Home")
    const code = createRoutesModule({ root: directory, routesDir })
    expect(code).toContain('"relativePath":"guide/setup.mdx","lastUpdated":1577934245000')
    expect(code).toContain('"relativePath":"home.md","lastUpdated":')
    expect(code).not.toContain(`"relativePath":"${directory}`)

    // A generated route can reuse a name that used to be committed.
    git(directory, ["rm", "--cached", "app/routes/guide/setup.mdx"])
    fs.writeFileSync(path.join(directory, ".gitignore"), "app/routes/guide/setup.mdx\n")
    const generatedAt = new Date("2026-10-27T12:00:00Z")
    fs.utimesSync(source, generatedAt, generatedAt)
    const regenerated = createRoutesModule({ root: directory, routesDir })
    expect(regenerated).toContain(
      `"relativePath":"guide/setup.mdx","lastUpdated":${generatedAt.getTime()}`
    )
  })
})

type Site = { root: string; routesDir: string }

const copiedAt = new Date("2026-10-27T12:00:00Z")
const STAGED_FILES = ["guide/setup.mdx", "draft.md", "staged-only.md", "removed.md"]

/** A committed project and two copies of it outside its work tree, such as one per language. */
function stagedProject() {
  const source = temporaryDirectory("ardo-source-")
  write(path.join(source, "app/routes/guide/setup.mdx"), "# Setup")
  write(path.join(source, "app/routes/removed.md"), "# Removed")
  commitAll(source)
  // Present but never committed, and committed but deleted from the work tree.
  write(path.join(source, "app/routes/draft.md"), "# Draft")
  fs.rmSync(path.join(source, "app/routes/removed.md"))

  const stage = temporaryDirectory("ardo-stage-")
  const copy = (name: string): Site => {
    const root = path.join(stage, name)
    fs.cpSync(path.join(source, "app"), path.join(root, "app"), { recursive: true })
    // Only the copy has this page, and the copy still has the deleted one.
    write(path.join(root, "app/routes/staged-only.md"), "# Staged only")
    write(path.join(root, "app/routes/removed.md"), "# Removed")
    for (const file of STAGED_FILES)
      fs.utimesSync(path.join(root, "app/routes", file), copiedAt, copiedAt)
    return { root, routesDir: path.join(root, "app/routes") }
  }
  return { source, en: copy("en"), de: copy("de") }
}

function lastUpdated(code: string, relativePath: string): number {
  return Number(
    new RegExp(`"relativePath":"${relativePath}","lastUpdated":(\\d+)`, "u").exec(code)?.[1]
  )
}

function routeTable(site: Site, options: { sourceRoot?: string }): string {
  return createRoutesModule({
    ...site,
    config: resolveConfig({ title: "Docs", ...options }, site.root),
  })
}

/** The sitemap `lastmod` of each page path, built at a pinned buildTime. */
async function sitemapDates(site: Site, options: { sourceRoot?: string }) {
  const config = resolveConfig(
    {
      title: "Docs",
      siteUrl: "https://example.test",
      buildTime: "2026-06-01T00:00:00Z",
      seo: { llms: false, robots: false },
      ...options,
    },
    site.root
  )
  const manifest = await scanRouteManifest(site.routesDir, createRouteManifestOptions(config))
  const assets = createBuildOutputAssets(manifest, config, { routesDir: site.routesDir })
  const xml = String(assets.find((asset) => asset.fileName === "sitemap.xml")?.source)
  return (page: string) =>
    new RegExp(`<loc>https://example.test${page}</loc>\\s*<lastmod>([^<]+)</lastmod>`, "u").exec(
      xml
    )?.[1]
}

/**
 * A site that builds from a copy of its project outside the Git work tree, such as one copy per
 * language. `sourceRoot` names the project the copy mirrors.
 */
describe("a staged copy with sourceRoot", () => {
  it("dates the route table by the source file's commit, with today's fallback otherwise", () => {
    const { source, en, de } = stagedProject()
    const english = routeTable(en, { sourceRoot: source })
    expect(lastUpdated(english, "guide/setup.mdx")).toBe(COMMITTED)
    // Untracked, missing from the source, or deleted there: the copy's file time, as today.
    expect(lastUpdated(english, "draft.md")).toBe(copiedAt.getTime())
    expect(lastUpdated(english, "staged-only.md")).toBe(copiedAt.getTime())
    expect(lastUpdated(english, "removed.md")).toBe(copiedAt.getTime())
    // Another copy of the same project gets the same dates; a relative sourceRoot resolves
    // against the staged project's root.
    const german = routeTable(de, { sourceRoot: path.relative(de.root, source) })
    for (const file of STAGED_FILES)
      expect(lastUpdated(german, file)).toBe(lastUpdated(english, file))

    // Without the option, the copy has no history and keeps its file times.
    expect(lastUpdated(routeTable(en, {}), "guide/setup.mdx")).toBe(copiedAt.getTime())
  })

  it("dates sitemap entries by the source file's commit, never later than buildTime", async () => {
    const { source, en, de } = stagedProject()
    const english = await sitemapDates(en, { sourceRoot: source })
    expect(english("/guide/setup")).toBe(new Date(COMMITTED).toISOString())
    // The copy's file time is after buildTime, so these keep today's capped fallback.
    for (const page of ["/draft", "/staged-only", "/removed"])
      expect(english(page)).toBe("2026-06-01T00:00:00.000Z")
    const german = await sitemapDates(de, { sourceRoot: source })
    for (const page of ["/guide/setup", "/draft", "/staged-only", "/removed"])
      expect(german(page)).toBe(english(page))

    expect((await sitemapDates(en, {}))("/guide/setup")).toBe("2026-06-01T00:00:00.000Z")
  })
})
