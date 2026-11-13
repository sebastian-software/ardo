import type { PageFrontmatter, SidebarItem } from "../config/types"

/** Static hosts may add a trailing slash without changing the documentation route. */
export function sidebarPathsMatch(link: string | undefined, currentPath: string): boolean {
  return link !== "" && link?.replace(/\/$/u, "") === currentPath.replace(/\/$/u, "")
}

/**
 * Find the current sidebar item based on the current path.
 * This is client-safe and does not use any Node.js modules.
 */
export function findCurrentSidebarItem(
  sidebar: SidebarItem[],
  currentPath: string
): SidebarItem | undefined {
  for (const item of sidebar) {
    if (sidebarPathsMatch(item.link, currentPath)) {
      return item
    }

    if (item.items) {
      const found = findCurrentSidebarItem(item.items, currentPath)
      if (found) {
        return found
      }
    }
  }

  return undefined
}

/**
 * Get the previous and next sidebar items for navigation.
 * This is client-safe and does not use any Node.js modules.
 *
 * The page's `prev` and `next` frontmatter take precedence: `false` drops that link, a string
 * replaces the text of the sidebar neighbour, and `{ text, link }` replaces both.
 */
export function getPrevNextLinks(
  sidebar: SidebarItem[],
  currentPath: string,
  frontmatter: Pick<PageFrontmatter, "next" | "prev"> = {}
): { prev?: SidebarItem; next?: SidebarItem } {
  const flatItems = flattenSidebar(sidebar)
  const currentIndex = flatItems.findIndex((item) => sidebarPathsMatch(item.link, currentPath))

  let prev: SidebarItem | undefined
  let next: SidebarItem | undefined
  if (currentIndex !== -1) {
    if (currentIndex > 0) prev = flatItems[currentIndex - 1]
    next = flatItems.at(currentIndex + 1)
  }

  const links: { prev?: SidebarItem; next?: SidebarItem } = {}
  const resolvedPrev = applyPaginationOverride(prev, frontmatter.prev)
  const resolvedNext = applyPaginationOverride(next, frontmatter.next)
  if (resolvedPrev !== undefined) links.prev = resolvedPrev
  if (resolvedNext !== undefined) links.next = resolvedNext
  return links
}

function applyPaginationOverride(
  computed: SidebarItem | undefined,
  override: unknown
): SidebarItem | undefined {
  if (override === false) return undefined
  // Page data carries the authored frontmatter, so a malformed value keeps the sidebar link.
  if (isAuthoredLink(override))
    return override.link === "" ? undefined : { text: override.text, link: override.link }
  if (computed === undefined) return undefined
  return typeof override === "string" ? { ...computed, text: override } : computed
}

function isAuthoredLink(value: unknown): value is { text: string; link: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    "link" in value &&
    typeof value.text === "string" &&
    typeof value.link === "string"
  )
}

function flattenSidebar(sidebar: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = []

  for (const item of sidebar) {
    if ((item.link ?? "") !== "") {
      result.push(item)
    }

    if (item.items) {
      result.push(...flattenSidebar(item.items))
    }
  }

  return result
}
