export type HeadingSlugger = {
  slug: (text: string) => string
}

export function createHeadingSlugger(fallbackPrefix = "heading"): HeadingSlugger {
  const seen = new Map<string, number>()
  let fallbackIndex = 0

  return {
    slug(text: string) {
      const baseSlug = slugifyHeadingText(text)
      const base = baseSlug === "" ? `${fallbackPrefix}-${fallbackIndex++}` : baseSlug
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      return count === 0 ? base : `${base}-${count}`
    },
  }
}

export function slugifyHeadingText(text: string): string {
  let slug = stripHtmlTags(text)
    .toLowerCase()
    .trim()
    .replaceAll(/[`*_~[\]()]/gu, "")
    .replaceAll(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replaceAll(/[\s_]+/gu, "-")

  while (slug.includes("--")) {
    slug = slug.replaceAll("--", "-")
  }

  return slug.replaceAll(/^-|-$/gu, "")
}

function stripHtmlTags(value: string): string {
  let result = ""
  let isInsideTag = false
  for (const character of value) {
    if (character === "<") {
      isInsideTag = true
      continue
    }

    if (character === ">") {
      isInsideTag = false
      continue
    }

    if (!isInsideTag) result += character
  }
  return result
}
