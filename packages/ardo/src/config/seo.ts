import type { ArdoConfig } from "./types"

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
