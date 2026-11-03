import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { AGENT_SKILLS_INDEX_PATH } from "./agent-skills"
import { toPageMarkdownPath } from "./llms-pages"
import { getLlmsAssetNames, hasPageMarkdownFiles } from "./llms-text"
import { createCurrentRouteIdentity } from "./route-identity"

/**
 * Agent discovery (ARD v0.91 entries in the AI Catalog 1.0 envelope). `ard.json` and
 * `ai-catalog.json` get the same bytes, which both schemas accept. The entries point at what the
 * build writes: the `llms.txt` index, the homepage's Markdown twin, and the skills index.
 */

export const AGENT_DISCOVERY_FILE_NAMES = [".well-known/ard.json", ".well-known/ai-catalog.json"]

export type AgentCatalogEntry = {
  identifier: string
  displayName: string
  type: string
  url: string
  representativeQueries: [string, string]
}

export type AgentDiscoveryManifest = {
  specVersion: "1.0"
  host: { displayName: string; identifier: string; documentationUrl: string }
  entries: AgentCatalogEntry[]
}

/** An entry before its identifier, which needs the publisher and the key. */
type CatalogDraft = Omit<AgentCatalogEntry, "identifier"> & { key: string }

/** Requires an absolute `siteUrl` and the origin root; check `isAgentDiscoveryEnabled` first. */
export function createAgentDiscoveryManifest(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  options: { skillsIndexPublished: boolean }
): AgentDiscoveryManifest {
  const siteRoot = config.siteUrl.replace(/\/$/u, "")
  const drafts = [
    ...llmsDraft(config, siteRoot),
    ...homeDraft(entries, config, siteRoot),
    ...skillsDraft(config, siteRoot, options.skillsIndexPublished),
  ]
  const publisher = publisherOf(config.siteUrl)
  return {
    specVersion: "1.0",
    host: {
      displayName: config.title,
      identifier: `${siteRoot}/`,
      documentationUrl: `${siteRoot}/`,
    },
    entries: drafts.map(({ key, ...entry }) => ({
      // The namespace is `docs`: discovery requires the origin root, so there is no base segment.
      identifier: `urn:air:${publisher}:docs:${key}`,
      ...entry,
    })),
  }
}

function llmsDraft(config: ResolvedConfig, siteRoot: string): CatalogDraft[] {
  if (config.seo.llms === false) return []
  const title = config.title
  return [
    {
      key: "index",
      displayName: `${title} documentation index`,
      type: "text/plain",
      url: `${siteRoot}/${getLlmsAssetNames(config).indexFileName}`,
      representativeQueries: [`Find the ${title} documentation`, `List topics covered by ${title}`],
    },
  ]
}

/** Only the homepage's own Markdown twin counts; a TSX homepage has none. */
function homeDraft(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  siteRoot: string
): CatalogDraft[] {
  if (!hasPageMarkdownFiles(config)) return []
  const homePath = createCurrentRouteIdentity("/", config).publicPath
  const home = entries.find(
    (entry) =>
      entry.source === "markdown" && entry.metadata.llms !== false && entry.publicPath === homePath
  )
  if (home === undefined) return []
  const title = config.title
  return [
    {
      key: "home",
      displayName: `${title} overview`,
      type: "text/markdown",
      url: `${siteRoot}${toPageMarkdownPath(home.publicPath)}`,
      representativeQueries: [`Get started with ${title}`, `Read an overview of ${title}`],
    },
  ]
}

function skillsDraft(
  config: ResolvedConfig,
  siteRoot: string,
  skillsIndexPublished: boolean
): CatalogDraft[] {
  if (!skillsIndexPublished) return []
  const title = config.title
  return [
    {
      key: "skills",
      displayName: `${title} agent skills`,
      type: "application/json",
      url: `${siteRoot}${AGENT_SKILLS_INDEX_PATH}`,
      representativeQueries: [
        `Find agent skills published by ${title}`,
        `Install a skill for working with ${title}`,
      ],
    },
  ]
}

/** The publisher is the authority in each identifier, so keep only characters a URN allows. */
function publisherOf(siteUrl: string): string {
  const host = new URL(siteUrl).hostname
    .toLowerCase()
    .replace(/\.$/u, "")
    .replaceAll(/[^a-z0-9.-]/gu, "-")
  return host || "localhost"
}
