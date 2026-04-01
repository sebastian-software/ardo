import { useLocation } from "react-router"

import type { SidebarItem } from "../config/types"

import { useArdoSidebar } from "../runtime/hooks"
import * as styles from "./Breadcrumb.css"

interface BreadcrumbResult {
  section?: string
  page?: string
}

function matchInChildren(
  groupText: string,
  items: SidebarItem[],
  path: string
): BreadcrumbResult | undefined {
  for (const item of items) {
    if (item.link === path) return { section: groupText, page: item.text }
    if (item.items != null) {
      const sub = item.items.find((s) => s.link === path)
      if (sub != null) return { section: groupText, page: sub.text }
    }
  }
  return undefined
}

function findBreadcrumb(sidebar: SidebarItem[], currentPath: string): BreadcrumbResult {
  for (const group of sidebar) {
    if (group.link === currentPath) return { page: group.text }
    if (group.items != null) {
      const found = matchInChildren(group.text, group.items, currentPath)
      if (found != null) return found
    }
  }
  return {}
}

export function ArdoBreadcrumb() {
  const sidebar = useArdoSidebar()
  const location = useLocation()
  const { section, page } = findBreadcrumb(sidebar, location.pathname)

  if (page == null || page === "") return null

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {section != null && section !== "" && (
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
