import { useArdoPath } from "../runtime/page-context"

import type { SidebarItem } from "../config/types"

import { useArdoLabels, useArdoSidebar } from "../runtime/hooks"
import { sidebarPathsMatch } from "../runtime/sidebar-utils"
import * as styles from "./Breadcrumb.css"
import { ChromeIcon } from "./chrome-icons"

type BreadcrumbResult = {
  section?: string
  page?: string
}

function matchInChildren(
  groupText: string,
  items: SidebarItem[],
  path: string
): BreadcrumbResult | undefined {
  for (const item of items) {
    if (sidebarPathsMatch(item.link, path)) return { section: groupText, page: item.text }
    if (item.items != null) {
      const sub = item.items.find((s) => sidebarPathsMatch(s.link, path))
      if (sub != null) return { section: groupText, page: sub.text }
    }
  }
  return undefined
}

function findBreadcrumb(sidebar: SidebarItem[], currentPath: string): BreadcrumbResult {
  for (const group of sidebar) {
    if (sidebarPathsMatch(group.link, currentPath)) return { page: group.text }
    if (group.items != null) {
      const found = matchInChildren(group.text, group.items, currentPath)
      if (found != null) return found
    }
  }
  return {}
}

export function ArdoBreadcrumb() {
  const sidebar = useArdoSidebar()
  const labels = useArdoLabels()
  const pathname = useArdoPath()
  const { section, page } = findBreadcrumb(sidebar, pathname)

  if (page == null || page === "") return null

  return (
    <nav className={styles.breadcrumb} aria-label={labels.breadcrumb.label}>
      {section != null && section !== "" && (
        <>
          <span>{section}</span>
          <span className={styles.breadcrumbSeparator} aria-hidden>
            <ChromeIcon name="chevron" size={12} />
          </span>
        </>
      )}
      <span className={styles.breadcrumbCurrent}>{page}</span>
    </nav>
  )
}
