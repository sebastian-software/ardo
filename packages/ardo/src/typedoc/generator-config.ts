import type { ProjectReflection } from "typedoc"

import type { TypeDocConfig } from "./types"

export interface ResolvedTypeDocConfig extends Omit<TypeDocConfig, "markdown" | "out" | "sidebar"> {
  out: string
  sidebar: {
    title: string
    position: number
    collapsed: boolean
  }
  markdown: {
    breadcrumbs: boolean
    hierarchy: boolean
    sourceLinks: boolean
    codeBlocks: boolean
    sourceBaseUrl?: string
  }
}

export interface TypeDocRuntimeContext {
  basePath: string
  config: ResolvedTypeDocConfig
  packageNameCache: Map<string, string | undefined>
  project: ProjectReflection
}

export function resolveTypeDocConfig(config: TypeDocConfig): ResolvedTypeDocConfig {
  const sidebar = resolveSidebarConfig(config.sidebar)
  const markdown = resolveMarkdownConfig(config.markdown)

  return {
    ...config,
    excludeExternals: withDefault(config.excludeExternals, true),
    excludeInternal: withDefault(config.excludeInternal, true),
    excludePrivate: withDefault(config.excludePrivate, true),
    excludeProtected: withDefault(config.excludeProtected, false),
    markdown,
    out: withDefault(config.out, "api"),
    sidebar,
    sort: withDefault(config.sort, ["source-order"]),
  }
}

export function getTypedocOptions(config: ResolvedTypeDocConfig): Record<string, unknown> {
  const options: Record<string, unknown> = {
    entryPoints: config.entryPoints,
    excludeExternals: config.excludeExternals,
    excludeInternal: config.excludeInternal,
    excludePrivate: config.excludePrivate,
    excludeProtected: config.excludeProtected,
    sort: config.sort,
    tsconfig: config.tsconfig,
  }

  applyOptionalOption(options, "exclude", config.exclude)
  applyOptionalOption(options, "categoryOrder", config.categoryOrder)
  applyOptionalOption(options, "groupOrder", config.groupOrder)
  applyOptionalOption(options, "plugin", config.plugin)
  applyOptionalOption(options, "readme", config.readme)

  return options
}

function applyOptionalOption(
  options: Record<string, unknown>,
  key: string,
  value: null | string | string[] | undefined
): void {
  if (value != null) {
    options[key] = value
  }
}

function withDefault<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback
}

function resolveSidebarConfig(sidebar: TypeDocConfig["sidebar"]): ResolvedTypeDocConfig["sidebar"] {
  return {
    collapsed: withDefault(sidebar?.collapsed, false),
    position: withDefault(sidebar?.position, 100),
    title: withDefault(sidebar?.title, "API Reference"),
  }
}

function resolveMarkdownConfig(
  markdown: TypeDocConfig["markdown"]
): ResolvedTypeDocConfig["markdown"] {
  return {
    breadcrumbs: withDefault(markdown?.breadcrumbs, true),
    codeBlocks: withDefault(markdown?.codeBlocks, true),
    hierarchy: withDefault(markdown?.hierarchy, true),
    sourceBaseUrl: markdown?.sourceBaseUrl,
    sourceLinks: withDefault(markdown?.sourceLinks, true),
  }
}
