import type { PreviewServer } from "vite"

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { preview } from "vite"
import { afterEach, describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { resolveArdoHref } from "../runtime/page-context"
import { spellPagePath, spellPageUrl } from "../runtime/trailing-slash"
import { collectRedirects, generateSitemap } from "./build-outputs"
import { getTrailingSlashRedirect } from "./dev-render"
import { transformMarkdownMeta } from "./markdown-meta"
import { createPageMetadata } from "./page-metadata"
import { configureStaticPreview } from "./preview-static"
import { createCurrentRouteIdentity } from "./route-identity"
import type { RouteManifestEntry } from "./route-manifest"

function site(trailingSlash?: boolean) {
  return resolveConfig(
    {
      title: "Docs",
      base: "/docs/",
      siteUrl: "https://example.com",
      ...(trailingSlash === undefined ? {} : { trailingSlash }),
    },
    "/site"
  )
}

function entry(config: ReturnType<typeof site>, routePath: string): RouteManifestEntry {
  const identity = createCurrentRouteIdentity(routePath, config)
  const frontmatter = { title: "Page", redirectFrom: routePath === "/" ? [] : [`${routePath}-old`] }
  const filePath = `/site/app/routes${routePath === "/" ? "/index" : routePath}.mdx`
  return {
    anchors: [],
    content: "",
    filePath,
    frontmatter,
    identity,
    lastmod: new Date("2026-01-02T03:04:05.000Z"),
    metadata: createPageMetadata({
      frontmatter,
      identity,
      sourcePath: path.relative(config.contentDir, filePath),
    }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    source: "markdown",
  }
}

function canonical(config: ReturnType<typeof site>) {
  const code = 'const _ardoFrontmatter = {"title":"Guide"};\n'
  return /rel: "canonical", href: "([^"]+)"/u.exec(
    transformMarkdownMeta(code, "/site/app/routes/guide/intro.md", {
      resolvedConfig: config,
      routesDir: "/site/app/routes",
    })?.code ?? ""
  )?.[1]
}

describe("page path spelling", () => {
  it("adds or drops the final slash and keeps the site root", () => {
    expect(spellPagePath("/docs/guide", true, "/docs/")).toBe("/docs/guide/")
    expect(spellPagePath("/docs/guide/", false, "/docs/")).toBe("/docs/guide")
    expect(spellPagePath("/docs/", false, "/docs/")).toBe("/docs/")
    expect(spellPagePath("/docs", true, "/docs/")).toBe("/docs/")
    expect(spellPagePath("/", false)).toBe("/")
    expect(spellPageUrl("https://example.com/docs/guide/?q=1#x", false, "/docs/")).toBe(
      "https://example.com/docs/guide?q=1#x"
    )
  })

  it("keeps any spelling without a setting", () => {
    for (const value of ["/docs/guide", "/docs/guide/"])
      expect(spellPagePath(value, undefined, "/docs/")).toBe(value)
  })
})

describe("one site-wide spelling", () => {
  it.each([
    {
      trailingSlash: undefined,
      url: "https://example.com/docs/guide/intro",
      link: "/docs/guide/intro/",
      target: "/docs/guide/intro",
    },
    {
      trailingSlash: true,
      url: "https://example.com/docs/guide/intro/",
      link: "/docs/guide/intro/",
      target: "/docs/guide/intro/",
    },
    {
      trailingSlash: false,
      url: "https://example.com/docs/guide/intro",
      link: "/docs/guide/intro",
      target: "/docs/guide/intro",
    },
  ] as const)(
    "trailingSlash $trailingSlash spells sitemap entries, canonicals, links, and redirect targets alike",
    ({ trailingSlash, url, link, target }) => {
      const config = site(trailingSlash)
      const entries = [entry(config, "/"), entry(config, "/guide/intro")]
      const sitemap = generateSitemap(entries, config)
      expect(sitemap).toContain(`<loc>${url}</loc>`)
      // The site root keeps its slash in every mode.
      expect(sitemap).toContain("<loc>https://example.com/docs/</loc>")
      expect(canonical(config)).toBe(url)
      expect(resolveArdoHref("/guide/intro", { base: "/docs/", path: "/", trailingSlash })).toBe(
        link
      )
      expect(resolveArdoHref("/", { base: "/docs/", path: "/guide", trailingSlash })).toBe("/docs/")
      // Files keep their name.
      expect(resolveArdoHref("/llms.txt", { base: "/docs/", path: "/", trailingSlash })).toBe(
        "/docs/llms.txt"
      )
      const redirect = collectRedirects(entries, config).find(
        (candidate) => candidate.from === "/guide/intro-old"
      )
      expect(redirect?.to).toBe(target)
    }
  )
})

const isPage = (pathname: string) => ["/guide/intro", "/guide/release-6.0"].includes(pathname)
const request = (url: string) => ({ url, headers: { accept: "text/html" }, method: "GET" })

const spellingRedirect = (url: string, trailingSlash: boolean | undefined) =>
  getTrailingSlashRedirect(request(url), { base: "/docs/", trailingSlash, isPage })

describe("redirects to the configured spelling", () => {
  it("sends the dev server's other spelling of a page to the configured one", () => {
    expect(spellingRedirect("/docs/guide/intro/", false)).toBe("/docs/guide/intro")
    expect(spellingRedirect("/docs/guide/intro", true)).toBe("/docs/guide/intro/")
    expect(spellingRedirect("/docs/guide/release-6.0", true)).toBe("/docs/guide/release-6.0/")
    expect(spellingRedirect("/docs/guide/intro", false)).toBeUndefined()
    expect(spellingRedirect("/docs/guide/intro/", true)).toBeUndefined()
  })

  it("leaves the root, files, unknown paths, and sites without a setting alone", () => {
    expect(spellingRedirect("/docs/", false)).toBeUndefined()
    expect(spellingRedirect("/docs/app.js", true)).toBeUndefined()
    expect(spellingRedirect("/docs/missing/", false)).toBeUndefined()
    expect(spellingRedirect("/docs/guide/intro/", undefined)).toBeUndefined()
    expect(spellingRedirect("/docs/guide/intro", undefined)).toBeUndefined()
  })
})

describe("ardo preview", () => {
  const directories: string[] = []
  const servers: PreviewServer[] = []
  afterEach(async () => {
    for (const server of servers.splice(0)) await server.close()
    for (const directory of directories.splice(0))
      rmSync(directory, { recursive: true, force: true })
  })

  async function start(trailingSlash: boolean | undefined): Promise<string> {
    const root = mkdtempSync(path.join(os.tmpdir(), "ardo-preview-slash-"))
    directories.push(root)
    const page = path.join(root, "dist/guide/intro")
    mkdirSync(page, { recursive: true })
    writeFileSync(path.join(root, "dist/index.html"), "<html><body>Home</body></html>")
    writeFileSync(path.join(page, "index.html"), "<html><body>Intro page</body></html>")
    const server = await preview({
      root,
      base: "/docs/",
      configFile: false,
      appType: "mpa",
      build: { outDir: "dist" },
      preview: { host: "127.0.0.1", port: 0, strictPort: true },
      plugins: [
        {
          name: "ardo-preview-slash",
          configurePreviewServer: (instance) => configureStaticPreview(instance, trailingSlash),
        },
      ],
    })
    servers.push(server)
    const address = server.httpServer.address()
    if (address == null || typeof address === "string") throw new Error("No preview port")
    return `http://127.0.0.1:${address.port}`
  }

  it.each([
    [true, "/docs/guide/intro?q=1", "/docs/guide/intro/?q=1"],
    [false, "/docs/guide/intro/?q=1", "/docs/guide/intro?q=1"],
  ] as const)(
    "with trailingSlash %s redirects the other spelling permanently",
    async (trailingSlash, from, to) => {
      const origin = await start(trailingSlash)
      const moved = await fetch(`${origin}${from}`, { redirect: "manual" })
      expect(moved.status).toBe(301)
      expect(moved.headers.get("location")).toBe(to)
      const page = await fetch(`${origin}${to}`, { redirect: "manual" })
      expect(page.status).toBe(200)
      expect(await page.text()).toContain("Intro page")
      const home = await fetch(`${origin}/docs/`, { redirect: "manual" })
      expect(home.status).toBe(200)
    }
  )

  it("serves both spellings without a setting, as before", async () => {
    const origin = await start(undefined)
    for (const pathname of ["/docs/guide/intro", "/docs/guide/intro/"]) {
      const response = await fetch(`${origin}${pathname}`, { redirect: "manual" })
      expect(response.status).toBe(200)
      expect(await response.text()).toContain("Intro page")
    }
  })
})
