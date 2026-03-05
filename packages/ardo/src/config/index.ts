import path from "node:path"

import type {
  ArdoConfig,
  HeadConfig,
  MarkdownConfig,
  NavItem,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  ResolvedConfig,
  SidebarItem,
  SocialLink,
  SponsorConfig,
  TOCItem,
  TypeDocConfig,
} from "./types"

export type {
  ArdoConfig,
  HeadConfig,
  MarkdownConfig,
  NavItem,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  ResolvedConfig,
  SidebarItem,
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
  const srcDir = config.srcDir ?? "content"
  const contentDir = path.resolve(root, srcDir)

  return {
    title: config.title,
    description: config.description ?? "",
    titleSeparator: config.titleSeparator ?? " | ",
    base: config.base ?? "/",
    srcDir,
    outDir: config.outDir ?? "dist",
    lang: config.lang ?? "en",
    head: config.head ?? [],
    markdown: {
      ...defaultMarkdownConfig,
      ...config.markdown,
    },
    vite: config.vite,
    project: config.project ?? {},
    root,
    contentDir,
  }
}

export async function loadConfig(root: string): Promise<ResolvedConfig> {
  const configPath = path.resolve(root, "press.config.ts")

  try {
    const configModule: unknown = await import(configPath)
    const config =
      typeof configModule === "object" && configModule !== null && "default" in configModule
        ? configModule.default
        : undefined

    if (isArdoConfig(config)) {
      return resolveConfig(config, root)
    }
  } catch {
    // Fall through to default config
  }

  return resolveConfig(
    {
      title: "Ardo",
      description: "Documentation powered by Ardo",
    },
    root
  )
}

function isArdoConfig(value: unknown): value is ArdoConfig {
  if (typeof value !== "object" || value === null) {
    return false
  }

  return "title" in value && typeof value.title === "string"
}
