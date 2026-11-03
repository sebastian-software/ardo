import type { PageBannerConfig, PageBannerVariant } from "../config/types"

const bannerKeys = new Set(["content", "dismissible", "id", "variant"])

type BannerOptions = Partial<Omit<PageBannerConfig, "content">>

/**
 * Parses the `banner` frontmatter field, either a string of text or an object. The reason of a
 * failure is a short clause that the caller completes into a diagnostic, so the message names
 * the exact problem.
 */
export function parsePageBanner(value: unknown): { banner: PageBannerConfig } | { reason: string } {
  if (typeof value === "string") {
    return value.trim() === ""
      ? { reason: "the banner text is empty" }
      : { banner: { content: value } }
  }
  if (!isRecord(value)) {
    return { reason: "use a string or an object with a content key" }
  }

  const unknownKey = Object.keys(value).find((key) => !bannerKeys.has(key))
  if (unknownKey !== undefined) {
    return {
      reason: `unsupported key "${unknownKey}". Allowed keys are content, variant, id, and dismissible`,
    }
  }

  const { content, dismissible, id, variant } = value
  if (typeof content !== "string" || content.trim() === "") {
    return { reason: "content must be a non-empty string" }
  }

  const options = parseBannerOptions({ dismissible, id, variant })
  return "reason" in options ? options : { banner: { content, ...options.fields } }
}

function parseBannerOptions(input: {
  dismissible: unknown
  id: unknown
  variant: unknown
}): { reason: string } | { fields: BannerOptions } {
  const { dismissible, id, variant } = input
  if (variant !== undefined && !isBannerVariant(variant)) {
    return { reason: "variant must be one of tip, warning, danger, info, or note" }
  }
  if (id !== undefined && (typeof id !== "string" || id.trim() === "")) {
    return { reason: "id must be a non-empty string" }
  }
  if (dismissible !== undefined && typeof dismissible !== "boolean") {
    return { reason: "dismissible must be true or false" }
  }
  if (dismissible === true && id === undefined) {
    return {
      reason:
        'dismissible needs an id. The id keys the dismissal in localStorage, so use a stable value such as "release-7"',
    }
  }

  return {
    fields: {
      ...(variant === undefined ? {} : { variant }),
      ...(id === undefined ? {} : { id }),
      ...(dismissible === undefined ? {} : { dismissible }),
    },
  }
}

function isBannerVariant(value: unknown): value is PageBannerVariant {
  return (
    value === "danger" ||
    value === "info" ||
    value === "note" ||
    value === "tip" ||
    value === "warning"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value)
}
