import { useLocation } from "react-router"

import type { SidebarItem } from "../config/types"

import { useArdoSidebar } from "../runtime/hooks"
import * as styles from "./Breadcrumb.css"

/**
 * Finds the breadcrumb path (section > page) for the current route.
 */
function findBreadcrumb(
  sidebar: SidebarItem[],
  currentPath: string
): { section?: string; page?: string } {
  for (const group of sidebar) {
    // Check if current page is a direct child of this group
    if (group.link === currentPath) {
      return { page: group.text }
    }

    if (group.items) {
      for (const item of group.items) {
        if (item.link === currentPath) {
          return { section: group.text, page: item.text }
        }

        // Check nested items (level 3)
        if (item.items) {
          for (const sub of item.items) {
            if (sub.link === currentPath) {
              return { section: group.text, page: sub.text }
            }
          }
        }
      }
    }
  }

  return {}
}

export function ArdoBreadcrumb() {
  const sidebar = useArdoSidebar()
  const location = useLocation()
  const { section, page } = findBreadcrumb(sidebar, location.pathname)

  if (!page) return null

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {section != null && (
        <>
          <span>{section}</span>
          <span className={styles.breadcrumbSeparator} aria-hidden>
            ›
          </span>
        </>
      )}
      <span className={styles.breadcrumbCurrent}>{page}</span>
    </nav>
  )
}
