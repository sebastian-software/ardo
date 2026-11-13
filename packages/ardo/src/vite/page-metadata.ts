import type { PageFrontmatter } from "../config/types"
import type { RouteIdentity } from "./route-identity"
import { parsePageBanner } from "./page-banner"

import { normalizeLintFrontmatter } from "../config/lint-rules"
import { isOutlineSetting } from "../markdown/toc"
import {
  booleanFrontmatterFields,
  knownFrontmatterFields,
  stringFrontmatterFields,
} from "./page-frontmatter-fields"

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

const structuredFrontmatterNormalizers: Record<
  string,
  (value: unknown) => PageFrontmatterMetadata | undefined
> = {
  banner: normalizeBanner,
  contentWidth: (value) =>
    value === "reading" || value === "page" ? { contentWidth: value } : undefined,
  features: (value) => (isFeatures(value) ? { features: value } : undefined),
  hero: (value) => (isHero(value) ? { hero: value } : undefined),
  layout: normalizeLayout,
  lint: normalizeLintFrontmatter,
  next: normalizeNext,
  outline: (value) => (isOutlineSetting(value) ? { outline: value } : undefined),
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
        message: describeInvalidFrontmatterField(field, value),
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

/** Names the reason for a banner, which has the most detailed rules; other fields use a short message. */
function describeInvalidFrontmatterField(field: string, value: unknown): string {
  const parsed = field === "banner" ? parsePageBanner(value) : undefined
  if (parsed != null && "reason" in parsed) {
    return `Invalid value for frontmatter field "banner": ${parsed.reason}.`
  }
  return `Invalid value for frontmatter field "${field}".`
}

function normalizeFrontmatterField(
  field: string,
  value: unknown
): PageFrontmatterMetadata | undefined {
  if (field === "authors" || field === "tags")
    return Array.isArray(value) && value.every((entry) => typeof entry === "string")
      ? { [field]: value }
      : undefined
  if (field === "coverImage" || field === "images" || field === "_ardoPost")
    return isRecord(value) ? { [field]: value } : undefined
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

function normalizeBanner(value: unknown): PageFrontmatterMetadata | undefined {
  const parsed = parsePageBanner(value)
  return "banner" in parsed ? { banner: parsed.banner } : undefined
}

function normalizeLayout(value: unknown): PageFrontmatterMetadata | undefined {
  return value === "bare" || value === "default" ? { layout: value } : undefined
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
  if (typeof value === "string") return { redirectFrom: [value] }
  if (!Array.isArray(value)) return undefined

  const redirectFrom = value.filter((item): item is string => isString(item))
  return redirectFrom.length === 0 ? undefined : { redirectFrom }
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

function isString(value: unknown): value is string {
  return typeof value === "string"
}
