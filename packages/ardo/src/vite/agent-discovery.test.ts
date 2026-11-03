import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { resolveConfig } from "../config"
import { AGENT_DISCOVERY_FILE_NAMES } from "./agent-discovery"
import { createAgentOutputs } from "./agent-outputs"
import { createPageMetadata } from "./page-metadata"
import { createCurrentRouteIdentity } from "./route-identity"

const SITE = "https://docs.example.com"
const ID_PATTERN = /^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/u

let project: string

beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-agent-discovery-"))
})

afterEach(() => {
  fs.rmSync(project, { recursive: true, force: true })
})

function writeSkill() {
  const target = path.join(project, "skills", "ardo", "SKILL.md")
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, "---\nname: ardo\ndescription: Set up Ardo sites.\n---\n# Ardo\n")
}

function page(
  config: ResolvedConfig,
  routePath: string,
  source: "markdown" | "tsx"
): RouteManifestEntry {
  const identity = createCurrentRouteIdentity(routePath, config)
  const frontmatter = {}
  return {
    anchors: [],
    content: "# Page",
    filePath: path.join(config.contentDir, `${routePath === "/" ? "index" : routePath}.md`),
    frontmatter,
    identity,
    lastmod: new Date("2026-11-01"),
    metadata: createPageMetadata({
      frontmatter,
      identity,
      sourcePath: `${routePath === "/" ? "index" : routePath.slice(1)}.md`,
    }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    source,
  }
}

function discoveryFiles(outputs: ReturnType<typeof createAgentOutputs>) {
  return outputs.assets.filter((asset) => AGENT_DISCOVERY_FILE_NAMES.includes(asset.fileName))
}

function parseCatalog(outputs: ReturnType<typeof createAgentOutputs>) {
  const file = outputs.assets.find((asset) => asset.fileName === ".well-known/ard.json")
  return JSON.parse(file!.source)
}

describe("agent discovery files", () => {
  it("writes identical ARD and AI Catalog files that list the llms index, the homepage twin and the skills index", () => {
    writeSkill()
    const config = resolveConfig({ title: "Example", siteUrl: SITE }, project)
    const entries = [page(config, "/", "markdown"), page(config, "/guide", "markdown")]

    const outputs = createAgentOutputs(entries, config)
    const ard = outputs.assets.find((asset) => asset.fileName === ".well-known/ard.json")!
    const catalog = outputs.assets.find(
      (asset) => asset.fileName === ".well-known/ai-catalog.json"
    )!

    expect(outputs.warnings).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([])
    expect(catalog.source).toBe(ard.source)
    const manifest = JSON.parse(ard.source)
    expect(manifest).toStrictEqual({
      specVersion: "1.0",
      host: {
        displayName: "Example",
        identifier: `${SITE}/`,
        documentationUrl: `${SITE}/`,
      },
      entries: [
        {
          identifier: "urn:air:docs.example.com:docs:index",
          displayName: "Example documentation index",
          type: "text/plain",
          url: `${SITE}/llms.txt`,
          representativeQueries: [
            "Find the Example documentation",
            "List topics covered by Example",
          ],
        },
        {
          identifier: "urn:air:docs.example.com:docs:home",
          displayName: "Example overview",
          type: "text/markdown",
          url: `${SITE}/index.md`,
          representativeQueries: ["Get started with Example", "Read an overview of Example"],
        },
        {
          identifier: "urn:air:docs.example.com:docs:skills",
          displayName: "Example agent skills",
          type: "application/json",
          url: `${SITE}/.well-known/agent-skills/index.json`,
          representativeQueries: [
            "Find agent skills published by Example",
            "Install a skill for working with Example",
          ],
        },
      ],
    })
  })

  it("keeps every entry within the ARD and AI Catalog shape: an identifier, a type, one url, and 2-5 queries", () => {
    writeSkill()
    writeSkill()
    const config = resolveConfig({ title: "Example", siteUrl: SITE }, project)
    const entries = [page(config, "/", "markdown"), page(config, "/guide", "markdown")]

    const {
      specVersion,
      host,
      entries: catalog,
    } = parseCatalog(createAgentOutputs(entries, config))

    expect(specVersion).toBe("1.0")
    expect(Object.keys(host).sort()).toStrictEqual([
      "displayName",
      "documentationUrl",
      "identifier",
    ])
    for (const item of catalog) {
      expect(item.identifier).toMatch(ID_PATTERN)
      expect(typeof item.displayName).toBe("string")
      expect(typeof item.type).toBe("string")
      expect(typeof item.url).toBe("string")
      expect(item).not.toHaveProperty("data")
      expect(item.representativeQueries.length).toBeGreaterThanOrEqual(2)
      expect(item.representativeQueries.length).toBeLessThanOrEqual(5)
    }
    const identifiers = catalog.map((item: { identifier: string }) => item.identifier)
    expect(new Set(identifiers).size).toBe(identifiers.length)
  })

  it("lists no homepage twin when the homepage is a TSX route", () => {
    const config = resolveConfig({ title: "Example", siteUrl: SITE }, project)

    const { entries } = parseCatalog(createAgentOutputs([page(config, "/", "tsx")], config))

    expect(entries.map((entry: { identifier: string }) => entry.identifier)).toStrictEqual([
      "urn:air:docs.example.com:docs:index",
    ])
  })

  it("lists no homepage twin when per-page Markdown files are off, because the URL would not exist", () => {
    const config = resolveConfig(
      { title: "Example", siteUrl: SITE, seo: { llms: { pages: false } } },
      project
    )

    const { entries } = parseCatalog(createAgentOutputs([page(config, "/", "markdown")], config))

    expect(entries.map((entry: { identifier: string }) => entry.identifier)).toStrictEqual([
      "urn:air:docs.example.com:docs:index",
    ])
  })

  it("omits the llms index when llms is off, and writes an empty catalog rather than dangling links", () => {
    const config = resolveConfig({ title: "Example", siteUrl: SITE, seo: { llms: false } }, project)

    const outputs = createAgentOutputs([], config)

    expect(parseCatalog(outputs).entries).toStrictEqual([])
    expect(discoveryFiles(outputs)).toHaveLength(2)
  })

  it("points the index at the root llms.txt, which lists current-version pages, even with a custom file name", () => {
    const config = resolveConfig(
      { title: "Example", siteUrl: SITE, seo: { llms: { indexFileName: "ai.txt" } } },
      project
    )

    const { entries } = parseCatalog(createAgentOutputs([], config))

    expect(entries[0].url).toBe(`${SITE}/ai.txt`)
  })

  it("skips discovery without siteUrl with one info line when agentDiscovery is set explicitly", () => {
    const config = resolveConfig({ title: "Example", seo: { agentDiscovery: true } }, project)

    const outputs = createAgentOutputs([page(config, "/", "markdown")], config)

    expect(discoveryFiles(outputs)).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([
      "[ardo] Agent discovery files need siteUrl; skipping /.well-known/ard.json and /.well-known/ai-catalog.json.",
    ])
    expect(config.agentDiscoveryUrl).toBeUndefined()
  })

  it("skips discovery silently without siteUrl under the default settings", () => {
    const config = resolveConfig({ title: "Example" }, project)

    const outputs = createAgentOutputs([page(config, "/", "markdown")], config)

    expect(discoveryFiles(outputs)).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([])
    expect(config.agentDiscoveryUrl).toBeUndefined()
  })

  it("skips discovery under a deployment base with one info line when agentDiscovery is set explicitly", () => {
    const config = resolveConfig(
      { title: "Example", siteUrl: SITE, base: "/docs/", seo: { agentDiscovery: true } },
      project
    )

    const outputs = createAgentOutputs([page(config, "/", "markdown")], config)

    expect(discoveryFiles(outputs)).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([
      "[ardo] Agent discovery files are served from the origin root; skipping them for base /docs/.",
    ])
    expect(config.agentDiscoveryUrl).toBeUndefined()
  })

  it("skips discovery silently under a deployment base under the default settings", () => {
    const config = resolveConfig({ title: "Example", siteUrl: SITE, base: "/docs/" }, project)

    const outputs = createAgentOutputs([page(config, "/", "markdown")], config)

    expect(discoveryFiles(outputs)).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([])
    expect(config.agentDiscoveryUrl).toBeUndefined()
  })

  it("writes nothing and says nothing when agentDiscovery is false", () => {
    const config = resolveConfig(
      { title: "Example", siteUrl: SITE, seo: { agentDiscovery: false } },
      project
    )

    expect(
      discoveryFiles(createAgentOutputs([page(config, "/", "markdown")], config))
    ).toStrictEqual([])
    expect(config.agentDiscoveryUrl).toBeUndefined()
    expect(createAgentOutputs([], config).notices).toStrictEqual([])
  })

  it("builds the absolute ard.json URL that pages link to", () => {
    expect(
      resolveConfig({ title: "Example", siteUrl: `${SITE}/` }, project).agentDiscoveryUrl
    ).toBe(`${SITE}/.well-known/ard.json`)
    expect(resolveConfig({ title: "Example", siteUrl: SITE }, project).agentDiscoveryUrl).toBe(
      `${SITE}/.well-known/ard.json`
    )
  })
})
