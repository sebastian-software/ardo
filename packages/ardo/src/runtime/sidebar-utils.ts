import type { SidebarItem } from "../config/types"

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
 */
export function getPrevNextLinks(
  sidebar: SidebarItem[],
  currentPath: string
): { prev?: SidebarItem; next?: SidebarItem } {
  const flatItems = flattenSidebar(sidebar)
  const currentIndex = flatItems.findIndex((item) => sidebarPathsMatch(item.link, currentPath))

  if (currentIndex === -1) {
    return {}
  }

  let prev: SidebarItem | undefined
  if (currentIndex > 0) prev = flatItems[currentIndex - 1]
  const next = flatItems.at(currentIndex + 1)

  return { prev, next }
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
