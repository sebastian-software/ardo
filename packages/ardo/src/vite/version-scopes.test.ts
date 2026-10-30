import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, expect, it } from "vitest"
import { resolveConfig } from "../config"
import { resolveArdoHref } from "../runtime/page-context"
import { createCurrentRouteIdentity } from "./route-identity"
import { createRouteManifestOptions, scanRouteManifest } from "./route-manifest"
import { createRoutesModule } from "./routes-plugin"
import { getVersioningRedirects } from "./build-versioning"
import { generateLlmsFullTxt } from "./llms-text"
import { resolveVersionedMainBase } from "./versioning"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

it("retains legacy global versioning unless directories are explicitly selected", () => {
  const versioning = { current: "v2", versions: [{ id: "v2", path: "/v2/" }] }
  const legacy = resolveConfig({ title: "Example", base: "/project/", versioning }, "/tmp")
  expect(legacy.base).toBe("/project/v2/")
  expect(createCurrentRouteIdentity("/news/a", legacy).publicPath).toBe("/project/v2/news/a")
  const scoped = resolveConfig(
    {
      title: "Example",
      base: "/project/",
      versioning: { ...versioning, directories: ["guide", "api-reference"] },
    },
    "/tmp"
  )
  expect(scoped.base).toBe("/project/")
  expect(createCurrentRouteIdentity("/guide/a", scoped)).toMatchObject({
    versionId: "v2",
    publicPath: "/project/v2/guide/a",
  })
  expect(createCurrentRouteIdentity("/guidebook/a", scoped)).toStrictEqual({
    routePath: "/guidebook/a",
    publicPath: "/project/guidebook/a",
  })
  expect(createCurrentRouteIdentity("/", scoped).publicPath).toBe("/project/")
  expect(getVersioningRedirects(scoped)).toStrictEqual([])
  expect(
    resolveVersionedMainBase({
      command: "build",
      root: "/tmp",
      userBase: "/project/v2/",
      siteConfig: { versioning: { ...versioning, directories: ["guide"] } },
    }).deploymentBase
  ).toBe("/project/v2/")
})

it("carries public identities through the route table, manifest, and portable links", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-scopes-"))
  roots.push(root)
  const routesDir = path.join(root, "app/routes")
  for (const directory of ["guide", "news"])
    await fs.mkdir(path.join(routesDir, directory), { recursive: true })
  await fs.writeFile(
    path.join(routesDir, "home.tsx"),
    "export default function Home() { return null }"
  )
  await fs.writeFile(path.join(routesDir, "guide/a.md"), "---\ntitle: Guide\n---\n[News](/news/a)")
  await fs.writeFile(path.join(routesDir, "news/a.md"), "---\ntitle: News\n---\n[Guide](/guide/a)")
  const config = resolveConfig(
    {
      title: "Example",
      siteUrl: "https://example.test",
      base: "/project/",
      versioning: { current: "v2", versions: [{ id: "v2", path: "/v2/" }], directories: ["guide"] },
    },
    root
  )
  const manifest = await scanRouteManifest(routesDir, createRouteManifestOptions(config))
  expect(manifest.find((entry) => entry.routePath === "/guide/a")?.publicPath).toBe(
    "/project/v2/guide/a"
  )
  expect(
    manifest.find((entry) => entry.routePath === "/news/a")?.identity.versionId
  ).toBeUndefined()
  const table = createRoutesModule({ root, routesDir, config })
  expect(table).toContain(
    'path: "/v2/guide/a", logicalPath: "/guide/a", publicPath: "/project/v2/guide/a"'
  )
  expect(table).toContain('path: "/news/a", logicalPath: "/news/a", publicPath: "/project/news/a"')
  const hrefs = new Map(manifest.map((entry) => [entry.routePath, entry.publicPath]))
  expect(
    resolveArdoHref("/guide/a?q=1#part", { base: config.base, path: "/news/a", routeHrefs: hrefs })
  ).toBe("/project/v2/guide/a/?q=1#part")
  expect(
    resolveArdoHref("/news/a", { base: config.base, path: "/guide/a", routeHrefs: hrefs })
  ).toBe("/project/news/a/")
  expect(
    resolveArdoHref("/project/v2/guide/a/", {
      base: config.base,
      path: "/news/a",
      routeHrefs: hrefs,
    })
  ).toBe("/project/v2/guide/a/")
  const full = generateLlmsFullTxt(manifest, config)
  expect(full).toContain("[News](<https://example.test/project/news/a/>)")
  expect(full).toContain("[Guide](<https://example.test/project/v2/guide/a/>)")
  expect(getVersioningRedirects(config, manifest)).toContainEqual({
    from: "/project/v2/",
    to: "/project/v2/guide/a/",
  })
  expect(
    resolveArdoHref("/guide/release-6.0", {
      base: config.base,
      path: "/news/a",
      routeHrefs: new Map([["/guide/release-6.0", "/project/v2/guide/release-6.0"]]),
    })
  ).toBe("/project/v2/guide/release-6.0/")
  await fs.mkdir(path.join(routesDir, "v2/guide"), { recursive: true })
  await fs.writeFile(path.join(routesDir, "v2/guide/a.md"), "# Collision")
  expect(() => createRoutesModule({ root, routesDir, config })).toThrow("same public URL")
})

it("preserves an explicit target locale when linking from news to versioned docs in LLM exports", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-localized-scopes-"))
  roots.push(root)
  const routesDir = path.join(root, "app/routes")
  for (const locale of ["en", "de"]) {
    await fs.mkdir(path.join(routesDir, locale, "guide"), { recursive: true })
    await fs.mkdir(path.join(routesDir, locale, "news"), { recursive: true })
    await fs.writeFile(path.join(routesDir, locale, "guide/a.md"), "---\ntitle: Guide\n---\nGuide")
    await fs.writeFile(
      path.join(routesDir, locale, "news/a.md"),
      "---\ntitle: News\n---\n[German guide](/de/guide/a)\n[Local guide](/guide/a)"
    )
  }
  const config = resolveConfig(
    {
      title: "Localized example",
      siteUrl: "https://example.test",
      base: "/project/",
      i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
      versioning: { current: "v2", versions: [{ id: "v2", path: "/v2/" }], directories: ["guide"] },
    },
    root
  )
  const manifest = await scanRouteManifest(routesDir, createRouteManifestOptions(config))
  const full = generateLlmsFullTxt(manifest, config)
  expect(full).toContain("[German guide](<https://example.test/project/v2/de/guide/a/>)")
  expect(full).toContain("[Local guide](<https://example.test/project/v2/en/guide/a/>)")
  expect(full).not.toContain("https://example.test/project/de/guide/")
})
