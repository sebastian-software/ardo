import type { PageFrontmatter } from "../config/types"
import type { RouteIdentity } from "./route-identity"

export type PageMetadata = {
  localeId?: string
  publicPath: string
  routePath: string
  sourcePath: string
  versionId?: string
} & PageFrontmatter

export type PageFrontmatterMetadata = PageFrontmatter

export type PageMetadataDiagnostic = {
  field: string
  kind: "invalid" | "unknown"
  message: string
}

export type PageMetadataValidationResult = {
  diagnostics: PageMetadataDiagnostic[]
  frontmatter: PageFrontmatterMetadata
}

const knownFrontmatterFields = new Set([
  "canonical",
  "collapsed",
  "description",
  "editLink",
  "features",
  "hero",
  "lastUpdated",
  "layout",
  "lede",
  "llms",
  "next",
  "ogDescription",
  "ogImage",
  "ogTitle",
  "ogType",
  "order",
  "outline",
  "prev",
  "redirectFrom",
  "sidebar",
  "sitemap",
  "title",
  "twitterCard",
  "twitterDescription",
  "twitterImage",
  "twitterTitle",
])

const stringFrontmatterFields = new Set([
  "canonical",
  "description",
  "ogDescription",
  "ogImage",
  "ogTitle",
  "ogType",
  "title",
  "twitterDescription",
  "twitterImage",
  "twitterTitle",
])

const booleanFrontmatterFields = new Set([
  "collapsed",
  "editLink",
  "lastUpdated",
  "lede",
  "llms",
  "sitemap",
])

const structuredFrontmatterNormalizers: Record<
  string,
  (value: unknown) => PageFrontmatterMetadata | undefined
> = {
  features: (value) => (isFeatures(value) ? { features: value } : undefined),
  hero: (value) => (isHero(value) ? { hero: value } : undefined),
  layout: normalizeLayout,
  next: normalizeNext,
  outline: (value) => (isOutline(value) ? { outline: value } : undefined),
  prev: normalizePrevious,
  redirectFrom: normalizeRedirectFrom,
  sidebar: normalizeSidebar,
  twitterCard: normalizeTwitterCard,
}

export function toFrontmatterRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {}
  }

  return { ...value }
}

export function parsePageFrontmatterMetadata(
  data: Record<string, unknown>
): PageFrontmatterMetadata {
  return validatePageFrontmatter(data).frontmatter
}

/**
 * Normalizes documented frontmatter and retains diagnostics instead of silently
 * dropping malformed values. Build consumers can choose whether diagnostics are
 * ignored, warnings, or errors without receiving untyped metadata.
 */
export function validatePageFrontmatter(
  data: Record<string, unknown>
): PageMetadataValidationResult {
  const diagnostics: PageMetadataDiagnostic[] = []
  const frontmatter: PageFrontmatterMetadata = {}

  for (const [field, value] of Object.entries(data)) {
    if (!knownFrontmatterFields.has(field)) {
      diagnostics.push({
        field,
        kind: "unknown",
        message: `Unsupported frontmatter field "${field}".`,
      })
      continue
    }

    const normalized = normalizeFrontmatterField(field, value)
    if (normalized == null) {
      diagnostics.push({
        field,
        kind: "invalid",
        message: `Invalid value for frontmatter field "${field}".`,
      })
      continue
    }

    Object.assign(frontmatter, normalized)
  }

  return { diagnostics, frontmatter }
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

function normalizeFrontmatterField(
  field: string,
  value: unknown
): PageFrontmatterMetadata | undefined {
  return (
    normalizePrimitiveFrontmatterField(field, value) ??
    normalizeStructuredFrontmatterField(field, value)
  )
}

function normalizePrimitiveFrontmatterField(
  field: string,
  value: unknown
): PageFrontmatterMetadata | undefined {
  if (stringFrontmatterFields.has(field)) {
    return typeof value === "string" ? { [field]: value } : undefined
  }

  if (booleanFrontmatterFields.has(field)) {
    return typeof value === "boolean" ? { [field]: value } : undefined
  }

  if (field === "order") {
    return typeof value === "number" && Number.isFinite(value) ? { order: value } : undefined
  }

  return undefined
}

function normalizeStructuredFrontmatterField(
  field: string,
  value: unknown
): PageFrontmatterMetadata | undefined {
  if (!(field in structuredFrontmatterNormalizers)) return undefined
  return structuredFrontmatterNormalizers[field](value)
}

function normalizeLayout(value: unknown): PageFrontmatterMetadata | undefined {
  return value === "doc" || value === "home" || value === "page" ? { layout: value } : undefined
}

function normalizeSidebar(value: unknown): PageFrontmatterMetadata | undefined {
  return value === "leaf" || typeof value === "boolean" ? { sidebar: value } : undefined
}

function normalizeTwitterCard(value: unknown): PageFrontmatterMetadata | undefined {
  return value === "summary" || value === "summary_large_image" ? { twitterCard: value } : undefined
}

function normalizeNext(value: unknown): PageFrontmatterMetadata | undefined {
  return isPaginationLink(value) ? { next: value } : undefined
}

function normalizePrevious(value: unknown): PageFrontmatterMetadata | undefined {
  return isPaginationLink(value) ? { prev: value } : undefined
}

function normalizeRedirectFrom(value: unknown): PageFrontmatterMetadata | undefined {
  if (typeof value === "string") return { redirectFrom: value }
  if (!Array.isArray(value)) return undefined

  const redirectFrom = value.filter(isString)
  return redirectFrom.length === 0 ? undefined : { redirectFrom }
}

function isOutline(value: unknown): value is NonNullable<PageFrontmatter["outline"]> {
  if (typeof value === "boolean" || typeof value === "number") return true
  return Array.isArray(value) && value.length === 2 && value.every(isNumber)
}

function isPaginationLink(value: unknown): value is NonNullable<PageFrontmatter["next"]> {
  return (
    value === false ||
    typeof value === "string" ||
    (isRecord(value) && typeof value.text === "string" && typeof value.link === "string")
  )
}

function isHero(value: unknown): value is NonNullable<PageFrontmatter["hero"]> {
  if (!isRecord(value)) return false
  if (
    !isOptionalString(value.name) ||
    !isOptionalString(value.text) ||
    !isOptionalString(value.tagline)
  ) {
    return false
  }
  if (value.image !== undefined && !isHeroImage(value.image)) return false
  if (value.actions !== undefined && !isHeroActions(value.actions)) return false
  return true
}

function isHeroImage(value: unknown): boolean {
  return (
    typeof value === "string" ||
    (isRecord(value) && typeof value.light === "string" && typeof value.dark === "string")
  )
}

function isHeroActions(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (action) =>
        isRecord(action) &&
        typeof action.text === "string" &&
        typeof action.link === "string" &&
        (action.theme === undefined || action.theme === "alt" || action.theme === "brand")
    )
  )
}

function isFeatures(value: unknown): value is NonNullable<PageFrontmatter["features"]> {
  return (
    Array.isArray(value) &&
    value.every(
      (feature) =>
        isRecord(feature) &&
        typeof feature.title === "string" &&
        typeof feature.details === "string" &&
        isOptionalString(feature.icon) &&
        isOptionalString(feature.link) &&
        isOptionalString(feature.linkText)
    )
  )
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}
