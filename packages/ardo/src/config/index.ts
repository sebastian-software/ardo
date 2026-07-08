import fs from "node:fs"
import path from "node:path"
import { URL } from "node:url"

import type {
  ArdoBrandConfig,
  ArdoBrandHue,
  ArdoBrandHuePreset,
  ArdoBrandLogo,
  ArdoConfig,
  HeadConfig,
  LinkCheckConfig,
  LlmsConfig,
  MarkdownConfig,
  MetadataConfig,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  RedirectConfig,
  ResolvedConfig,
  RobotsConfig,
  SeoConfig,
  SidebarConfig,
  SidebarItem,
  SitemapChangefreq,
  SitemapConfig,
  SocialLink,
  SponsorConfig,
  TOCItem,
  TypeDocConfig,
} from "./types"

import { resolveBrandThemeHues } from "./brand"

type ConfigModule = {
  default?: unknown
}

export type {
  ArdoBrandConfig,
  ArdoBrandHue,
  ArdoBrandHuePreset,
  ArdoBrandLogo,
  ArdoConfig,
  HeadConfig,
  LinkCheckConfig,
  LlmsConfig,
  MarkdownConfig,
  MetadataConfig,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  RedirectConfig,
  ResolvedConfig,
  RobotsConfig,
  SeoConfig,
  SidebarConfig,
  SidebarItem,
  SitemapChangefreq,
  SitemapConfig,
  SocialLink,
  SponsorConfig,
  TOCItem,
  TypeDocConfig,
}

export function defineConfig(config: ArdoConfig): ArdoConfig {
  return config
}

export const defaultMarkdownConfig: MarkdownConfig = {
  theme: {
    light: "github-light-default",
    dark: "github-dark-default",
  },
  lineNumbers: false,
  anchor: true,
  toc: {
    level: [2, 3],
  },
}

export function resolveConfig(config: ArdoConfig, root: string): ResolvedConfig {
  validateConfig(config)

  const srcDir = config.srcDir ?? "content"
  const contentDir = path.resolve(root, srcDir)

  return {
    title: config.title,
    description: config.description ?? "",
    titleSeparator: config.titleSeparator ?? " | ",
    base: config.base ?? "/",
    siteUrl: config.siteUrl ?? "",
    srcDir,
    outDir: config.outDir ?? "dist",
    lang: config.lang ?? "en",
    head: config.head ?? [],
    seo: config.seo ?? {},
    linkCheck: config.linkCheck ?? {},
    redirects: config.redirects ?? [],
    markdown: {
      ...defaultMarkdownConfig,
      ...config.markdown,
    },
    sidebar: config.sidebar ?? {},
    metadata: config.metadata ?? {},
    brand: config.brand ?? {},
    vite: config.vite,
    project: config.project ?? {},
    root,
    contentDir,
  }
}

export async function loadConfig(root: string): Promise<ResolvedConfig> {
  const configPath = path.resolve(root, "press.config.ts")
  if (!fs.existsSync(configPath)) {
    return resolveDefaultConfig(root)
  }

  const configModule = await importConfigModule(configPath)
  if (configModule == null) {
    return resolveDefaultConfig(root)
  }

  const config = configModule.default

  if (isArdoConfig(config)) {
    return resolveConfig(config, root)
  }

  console.warn(`[ardo] Config at ${configPath} does not export a valid Ardo config.`)
  console.warn("[ardo] Falling back to defaults.")
  return resolveDefaultConfig(root)
}

async function importConfigModule(configPath: string): Promise<ConfigModule | undefined> {
  try {
    const configModule: unknown = await import(configPath)
    if (typeof configModule === "object" && configModule !== null && "default" in configModule) {
      return configModule
    }
    return {}
  } catch (error) {
    console.warn(`[ardo] Failed to load config at ${configPath}. Falling back to defaults.`)
    if (error instanceof Error) {
      console.warn(`[ardo] ${error.message}`)
    }
    return undefined
  }
}

function resolveDefaultConfig(root: string): ResolvedConfig {
  return resolveConfig(
    {
      title: "Ardo",
      description: "Documentation powered by Ardo",
    },
    root
  )
}

function validateConfig(config: ArdoConfig): void {
  const errors: string[] = []

  if (config.base !== undefined && !isValidBasePath(config.base)) {
    errors.push('base must start and end with "/" (for example "/docs/").')
  }

  if (config.siteUrl !== undefined && config.siteUrl !== "" && !isValidUrl(config.siteUrl)) {
    errors.push("siteUrl must be an absolute URL.")
  }

  validateBrandConfig(config, errors)

  const sitemapPriority =
    typeof config.seo?.sitemap === "object" ? config.seo.sitemap.priority : undefined
  if (
    sitemapPriority !== undefined &&
    (!Number.isFinite(sitemapPriority) || sitemapPriority < 0 || sitemapPriority > 1)
  ) {
    errors.push("seo.sitemap.priority must be between 0 and 1.")
  }

  if (errors.length > 0) {
    throw new Error(`[ardo] Invalid config:\n${errors.map((error) => `- ${error}`).join("\n")}`)
  }
}

function validateBrandConfig(config: ArdoConfig, errors: string[]): void {
  try {
    resolveBrandThemeHues(config.brand)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }
}

function isValidBasePath(value: string): boolean {
  return value === "/" || (value.startsWith("/") && value.endsWith("/"))
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isArdoConfig(value: unknown): value is ArdoConfig {
  if (typeof value !== "object" || value === null) {
    return false
  }

  return "title" in value && typeof value.title === "string"
}
