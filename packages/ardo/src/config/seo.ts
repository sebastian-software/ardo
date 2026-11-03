import type { ArdoConfig, SeoConfig } from "./types"

/** Where discovery files live; `.well-known` is read at the origin root. */
const AGENT_DISCOVERY_PATH = "/.well-known/ard.json"

export function validateSitemapConfig(config: ArdoConfig, errors: string[]): void {
  const sitemapPriority =
    typeof config.seo?.sitemap === "object" ? config.seo.sitemap.priority : undefined
  if (
    sitemapPriority !== undefined &&
    (!Number.isFinite(sitemapPriority) || sitemapPriority < 0 || sitemapPriority > 1)
  ) {
    errors.push("seo.sitemap.priority must be between 0 and 1.")
  }

  const sitemapExclude =
    typeof config.seo?.sitemap === "object" ? config.seo.sitemap.exclude : undefined
  if (
    sitemapExclude !== undefined &&
    (!Array.isArray(sitemapExclude) ||
      sitemapExclude.some(
        (prefix) =>
          typeof prefix !== "string" ||
          !prefix.startsWith("/") ||
          prefix.includes("?") ||
          prefix.includes("#")
      ))
  ) {
    errors.push(
      'seo.sitemap.exclude must be an array of route path prefixes starting with "/", without queries or fragments.'
    )
  }
}

export function validateAgentSkillsConfig(config: ArdoConfig, errors: string[]): void {
  const agentSkills = config.seo?.agentSkills
  if (typeof agentSkills !== "object" || agentSkills === null) return
  const directory = agentSkills.directory
  if (directory !== undefined && (typeof directory !== "string" || directory.trim() === "")) {
    errors.push("seo.agentSkills.directory must be a non-empty folder path.")
  }
}

/**
 * The absolute URL of `ard.json` when discovery files are published, otherwise undefined. They
 * need absolute URLs and the origin root, because `/.well-known` cannot sit below a deployment base.
 */
export function resolveAgentDiscoveryUrl(input: {
  deploymentBase: string
  seo: SeoConfig
  siteUrl: string
}): string | undefined {
  if (input.seo.agentDiscovery === false || input.siteUrl === "") return undefined
  if (input.deploymentBase !== "/") return undefined
  return `${input.siteUrl.replace(/\/$/u, "")}${AGENT_DISCOVERY_PATH}`
}
