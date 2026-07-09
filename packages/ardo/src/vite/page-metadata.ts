import type { RouteIdentity } from "./route-identity"

export type PageMetadata = {
  title?: string
  description?: string
  collapsed?: boolean
  order?: number
  sidebar?: "leaf" | boolean
  sitemap?: boolean
  redirectFrom?: string[]
  llms?: boolean
  versionId?: string
  localeId?: string
  sourcePath: string
  routePath: string
  publicPath: string
}

export type PageFrontmatterMetadata = Pick<
  PageMetadata,
  "collapsed" | "description" | "llms" | "order" | "redirectFrom" | "sidebar" | "sitemap" | "title"
>

export function toFrontmatterRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    return {}
  }

  const record: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry
  }
  return record
}

export function parsePageFrontmatterMetadata(
  data: Record<string, unknown>
): PageFrontmatterMetadata {
  return {
    collapsed: typeof data.collapsed === "boolean" ? data.collapsed : undefined,
    description: typeof data.description === "string" ? data.description : undefined,
    llms: typeof data.llms === "boolean" ? data.llms : undefined,
    order: typeof data.order === "number" ? data.order : undefined,
    redirectFrom: parseRedirectFrom(data.redirectFrom),
    sidebar: parseSidebarValue(data.sidebar),
    sitemap: typeof data.sitemap === "boolean" ? data.sitemap : undefined,
    title: typeof data.title === "string" ? data.title : undefined,
  }
}

export function createPageMetadata(input: {
  frontmatter: PageFrontmatterMetadata
  identity: RouteIdentity
  sourcePath: string
}): PageMetadata {
  return {
    ...input.frontmatter,
    ...(input.identity.versionId == null ? {} : { versionId: input.identity.versionId }),
    ...(input.identity.localeId == null ? {} : { localeId: input.identity.localeId }),
    sourcePath: input.sourcePath,
    routePath: input.identity.routePath,
    publicPath: input.identity.publicPath,
  }
}

function parseRedirectFrom(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    return [value]
  }

  if (Array.isArray(value)) {
    const redirects = value.filter((entry): entry is string => typeof entry === "string")
    return redirects.length === 0 ? undefined : redirects
  }

  return undefined
}

function parseSidebarValue(value: unknown): "leaf" | boolean | undefined {
  if (typeof value === "boolean") return value
  if (value === "leaf") return "leaf"
  return undefined
}
