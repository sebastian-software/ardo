import type { SidebarItem } from '../config/types'

/**
 * Find the current sidebar item based on the current path.
 * This is client-safe and does not use any Node.js modules.
 */
export function findCurrentSidebarItem(
  sidebar: SidebarItem[],
  currentPath: string
): SidebarItem | undefined {
  for (const item of sidebar) {
    if (item.link === currentPath) {
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
  const currentIndex = flatItems.findIndex((item) => item.link === currentPath)

  if (currentIndex === -1) {
    return {}
  }

  const prev = currentIndex > 0 ? flatItems[currentIndex - 1] : undefined
  const next = currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : undefined

  return { prev, next }
}

function flattenSidebar(sidebar: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = []

  for (const item of sidebar) {
    if (item.link) {
      result.push(item)
    }

    if (item.items) {
      result.push(...flattenSidebar(item.items))
    }
  }

  return result
}
