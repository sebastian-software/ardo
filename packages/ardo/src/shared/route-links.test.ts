import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import type { ArdoConfig, ResolvedConfig } from "../config/types"

import { resolveConfig } from "../config"
import { createClientRoutesModule, createRoutesModule } from "../vite/routes-plugin"
import { createRouteHrefs, getRouteLinks } from "./route-links"

type TableEntry = {
  id: string
  /** The authored path `ArdoApp` used: `logicalPath`, or `path` without versioning. */
  logical: string
  path: string
  logicalPath?: string
  publicPath?: string
}

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

/** Write route files into a temporary project and resolve its config. */
async function createSite(files: string[], options: Omit<ArdoConfig, "title"> = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-route-links-"))
  roots.push(root)
  const routesDir = path.join(root, "app/routes")
  for (const file of files) {
    const target = path.join(routesDir, file)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(
      target,
      file.endsWith(".tsx") ? "export default function Page() { return null }" : "# Page\n"
    )
  }
  const config = resolveConfig({ title: "Links", ...options }, root)
  return { config, root, routesDir }
}

/** Read the entries of the generated server route table. */
function readRouteTable(source: string): TableEntry[] {
  const string = String.raw`"(?:[^"\\]|\\.)*"`
  const entry = new RegExp(
    String.raw`^  \{ id: (${string}), path: (${string}), (?:logicalPath: (${string}), publicPath: (${string}), )?load:`,
    "gmu"
  )
  return [...source.matchAll(entry)].map(([, id, routePath, logicalPath, publicPath]) => {
    const route = {
      id: parseString(id),
      path: parseString(routePath),
      ...(logicalPath == null ? {} : { logicalPath: parseString(logicalPath) }),
      ...(publicPath == null ? {} : { publicPath: parseString(publicPath) }),
    }
    return { ...route, logical: route.logicalPath ?? route.path }
  })
}

/** The logical paths the client route module exports. */
function readClientPaths(source: string): string[] {
  // The module exports a JSON array literal.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return JSON.parse(/^export const paths = (.*)$/mu.exec(source)?.[1] ?? "") as string[]
}

function parseString(literal: string | undefined): string {
  // The generated modules hold JSON string literals.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return JSON.parse(literal ?? "") as string
}

/**
 * The link data `ArdoApp` built from the full route table before the client stopped receiving
 * it. Kept verbatim as the reference the shared derivation must reproduce.
 */
function legacyLinks(routes: TableEntry[], config: ResolvedConfig, pagePath: string) {
  const paths = new Set(routes.map((route) => route.logicalPath ?? route.path))
  const hrefs = new Map(
    routes.flatMap((route) =>
      route.publicPath == null ? [] : [[route.logicalPath ?? route.path, route.publicPath]]
    )
  )
  const i18n = config.i18n
  if (i18n !== false && hrefs.size > 0) {
    const locale =
      i18n.locales.find((entry) => pagePath.split("/")[1] === entry.id)?.id ?? i18n.defaultLocale
    for (const route of routes) {
      if (route.publicPath == null) continue
      const logical = route.logicalPath ?? route.path
      if (logical === `/${locale}` || logical.startsWith(`/${locale}/`))
        hrefs.set(logical.slice(locale.length + 1) || "/", route.publicPath)
    }
  }
  return { paths, hrefs }
}

const versioning = {
  current: "v6",
  directories: ["guide"],
  versions: [
    { id: "v6", path: "/v6/" },
    { id: "v5", path: "/v5/" },
  ],
}

const fixtures: Array<[string, string[], Omit<ArdoConfig, "title">]> = [
  ["plain", ["home.tsx", "guide/intro.mdx", "guide/setup.md"], {}],
  [
    "globally versioned",
    ["home.tsx", "guide/intro.mdx"],
    { versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] } },
  ],
  [
    "versioned",
    ["home.tsx", "guide/index.mdx", "guide/intro.mdx", "news/launch.md"],
    { base: "/project/", versioning },
  ],
  [
    "localized and versioned",
    [
      "en/home.tsx",
      "en/guide/intro.mdx",
      "en/news/launch.md",
      "de/home.tsx",
      "de/guide/intro.mdx",
      "fr/guide/intro.mdx",
    ],
    {
      base: "/project/",
      versioning,
      i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }, { id: "fr" }] },
    },
  ],
  [
    "dotted and versioned",
    [
      "home.tsx",
      "guide/release-6.0.mdx",
      "guide/café-6.0.mdx",
      "guide/index.html.mdx",
      "news/v6.0.md",
    ],
    { versioning },
  ],
]

function findFixture(name: string): (typeof fixtures)[number] {
  const fixture = fixtures.find(([fixtureName]) => fixtureName === name)
  if (fixture == null) throw new Error(`No fixture named ${name}`)
  return fixture
}

type PinnedLinks = {
  /** Public address per logical path, in route table order. */
  publicPaths: Record<string, string>
  /** Locale aliases each page adds to the public paths. */
  aliases: Record<string, Record<string, string>>
}

/**
 * Literal link data for the fixtures whose addresses are easiest to get wrong, so the
 * derivation is not only checked against values computed by the same code.
 */
const pinned: Array<[string, PinnedLinks]> = [
  [
    "localized and versioned",
    {
      publicPaths: {
        "/de": "/project/de/",
        "/de/guide/intro": "/project/v6/de/guide/intro",
        "/en": "/project/en/",
        "/en/guide/intro": "/project/v6/en/guide/intro",
        "/en/news/launch": "/project/en/news/launch",
        "/fr/guide/intro": "/project/v6/fr/guide/intro",
      },
      aliases: {
        "/de/guide/intro": { "/": "/project/de/", "/guide/intro": "/project/v6/de/guide/intro" },
        "/en/news/launch": {
          "/": "/project/en/",
          "/guide/intro": "/project/v6/en/guide/intro",
          "/news/launch": "/project/en/news/launch",
        },
        // French has no home page, so `/` stays unmapped.
        "/fr/guide/intro": { "/guide/intro": "/project/v6/fr/guide/intro" },
        // Pages outside every locale use the default locale.
        "/missing": {
          "/": "/project/en/",
          "/guide/intro": "/project/v6/en/guide/intro",
          "/news/launch": "/project/en/news/launch",
        },
      },
    },
  ],
  [
    "dotted and versioned",
    {
      publicPaths: {
        "/": "/",
        "/guide/café-6.0": "/v6/guide/café-6.0",
        "/guide/index.html": "/v6/guide/index.html",
        "/guide/release-6.0": "/v6/guide/release-6.0",
        "/news/v6.0": "/news/v6.0",
      },
      aliases: { "/guide/release-6.0": {}, "/missing": {} },
    },
  ],
]

describe("route link derivation", () => {
  it.each(pinned)(
    "derives the literal public paths and hrefs of a %s site",
    async (name, links) => {
      const [, files, options] = findFixture(name)
      const { config, root, routesDir } = await createSite(files, options)
      const logicalPaths = readClientPaths(createClientRoutesModule({ routesDir }))
      expect(logicalPaths).toStrictEqual(Object.keys(links.publicPaths))
      expect(Object.fromEntries(getRouteLinks(logicalPaths, config).publicPaths)).toStrictEqual(
        links.publicPaths
      )
      // The server route table publishes the same addresses.
      const table = readRouteTable(createRoutesModule({ root, routesDir, config }))
      expect(
        Object.fromEntries(table.map((route) => [route.logical, route.publicPath]))
      ).toStrictEqual(links.publicPaths)
      for (const [pagePath, aliases] of Object.entries(links.aliases)) {
        const hrefs = Object.fromEntries(createRouteHrefs(logicalPaths, config, pagePath))
        expect({ pagePath, hrefs }).toStrictEqual({
          pagePath,
          hrefs: { ...links.publicPaths, ...aliases },
        })
      }
    }
  )

  it.each(fixtures)(
    "reproduces the paths and hrefs of the server route table for a %s site",
    async (_name, files, options) => {
      const { config, root, routesDir } = await createSite(files, options)
      const table = readRouteTable(createRoutesModule({ root, routesDir, config }))
      expect(table).toHaveLength(files.length)
      // Server and client read their logical paths from this one export.
      const logicalPaths = readClientPaths(createClientRoutesModule({ routesDir }))
      expect(logicalPaths).toStrictEqual(table.map((route) => route.logical))
      for (const pagePath of [...logicalPaths, "/missing"]) {
        const expected = legacyLinks(table, config, pagePath)
        expect(getRouteLinks(logicalPaths, config).paths).toStrictEqual(expected.paths)
        expect(createRouteHrefs(logicalPaths, config, pagePath)).toStrictEqual(expected.hrefs)
      }
      for (const route of table) {
        expect(getRouteLinks(logicalPaths, config).publicPaths.get(route.logical)).toBe(
          route.publicPath
        )
      }
    }
  )

  it("derives the public paths once per paths array and config", () => {
    const config = resolveConfig({ title: "Links", versioning }, "/tmp")
    const paths = ["/", "/guide/intro"]
    const links = getRouteLinks(paths, config)
    expect(getRouteLinks(paths, config)).toBe(links)
    expect(links.publicPaths.get("/guide/intro")).toBe("/v6/guide/intro")
    const other = { ...config, versioning: { ...versioning, current: "v5" } }
    expect(getRouteLinks(paths, other).publicPaths.get("/guide/intro")).toBe("/v5/guide/intro")
    expect(getRouteLinks([...paths], config)).not.toBe(links)
  })

  it("returns a fresh hrefs map for every page", () => {
    const config = resolveConfig({ title: "Links", versioning }, "/tmp")
    const paths = ["/guide/intro"]
    const hrefs = createRouteHrefs(paths, config, "/guide/intro")
    expect(hrefs).not.toBe(getRouteLinks(paths, config).publicPaths)
    expect(hrefs).toStrictEqual(getRouteLinks(paths, config).publicPaths)
  })

  it("keeps dynamic parameter routes in the paths set and maps them like any other route", async () => {
    const { config, root, routesDir } = await createSite(
      ["home.tsx", "guide/intro.mdx", "guide/$topic.tsx"],
      { versioning }
    )
    const table = readRouteTable(createRoutesModule({ root, routesDir, config }))
    const logicalPaths = readClientPaths(createClientRoutesModule({ routesDir }))
    const dynamic = logicalPaths.filter((entry) => entry.includes(":"))
    expect(dynamic).toHaveLength(1)
    const links = getRouteLinks(logicalPaths, config)
    expect(links.paths).toContain(dynamic[0])
    expect(links.paths).toStrictEqual(legacyLinks(table, config, "/").paths)
    expect(createRouteHrefs(logicalPaths, config, "/")).toStrictEqual(
      legacyLinks(table, config, "/").hrefs
    )
  })

  it("has no public paths and no hrefs without directory versioning", () => {
    const paths = ["/", "/en/guide/intro", "/de/guide/intro"]
    const i18n = {
      defaultLocale: "en",
      locales: [{ id: "en" }, { id: "de" }],
    }
    const globalOnly = resolveConfig(
      {
        title: "Links",
        i18n,
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
      },
      "/tmp"
    )
    for (const config of [undefined, resolveConfig({ title: "Links", i18n }, "/tmp"), globalOnly]) {
      const links = getRouteLinks(paths, config)
      expect([...links.paths]).toStrictEqual(paths)
      expect(links.publicPaths.size).toBe(0)
      expect(createRouteHrefs(paths, config, "/de/guide/intro").size).toBe(0)
    }
  })

  it("does not leak link data between configs sharing one paths array", () => {
    const paths = ["/", "/guide/intro"]
    const v6 = resolveConfig({ title: "Links", versioning }, "/tmp")
    const v5 = resolveConfig(
      { title: "Links", versioning: { ...versioning, current: "v5" } },
      "/tmp"
    )
    const plain = resolveConfig({ title: "Links" }, "/tmp")
    const read = (config: ResolvedConfig) =>
      getRouteLinks(paths, config).publicPaths.get("/guide/intro")
    expect([read(v6), read(plain), read(v5), read(v6), read(plain)]).toStrictEqual([
      "/v6/guide/intro",
      undefined,
      "/v5/guide/intro",
      "/v6/guide/intro",
      undefined,
    ])
  })
})
