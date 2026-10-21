export type SearchMatch = {
  id: string
  title: string
  path: string
  /** Title of the page a heading result belongs to. */
  pageTitle?: string
  /** Text of the matched section. */
  excerpt?: string
  section?: string
}

const EXCERPT_LENGTH = 160

/**
 * Where a result lives. Headings such as "Parameters" repeat across pages, so
 * a heading result names its page before the section.
 */
export function getSearchResultContext(result: SearchMatch): string | undefined {
  const page = result.pageTitle === result.title ? undefined : result.pageTitle
  const context = [page, result.section].filter((part) => part != null && part !== "")
  return context.length === 0 ? undefined : context.join(" · ")
}

export function shortenExcerpt(excerpt: string): string {
  if (excerpt.length <= EXCERPT_LENGTH) return excerpt
  const cut = excerpt.lastIndexOf(" ", EXCERPT_LENGTH)
  return `${excerpt.slice(0, cut > 0 ? cut : EXCERPT_LENGTH)}…`
}
