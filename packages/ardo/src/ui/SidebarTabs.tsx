import { useArdoLabels } from "../runtime/hooks"
import type { ReactNode } from "react"

import { ArdoLink } from "../runtime/page"

import * as styles from "./SidebarTabs.css"

type RoutePath = string

export type SidebarTabItem = {
  key: string
  label: string
  to: RoutePath
  icon?: ReactNode
  active: boolean
}

/**
 * Section tabs on the sidebar's outer edge. On wide screens each tab is a
 * horizontal tab turned 90°: icon first, label reading bottom to top. Inside
 * the mobile drawer the same tabs lie flat above the section tree.
 *
 * The tabs are links, not an ARIA tablist: switching a section navigates.
 */
export function SidebarTabs({ items }: { items: SidebarTabItem[] }) {
  const labels = useArdoLabels()
  return (
    <nav aria-label={labels.sidebar.sections} className={`ardo-sidebar-tabs ${styles.sectionTabs}`}>
      <ul className={styles.sectionTabList}>
        {items.map((item) => (
          <li key={item.key}>
            <ArdoLink
              to={item.to}
              aria-current={item.active ? "true" : undefined}
              className={[styles.sectionTab, item.active && "active"].filter(Boolean).join(" ")}
            >
              <span className={styles.sectionTabInner}>
                {item.icon != null && (
                  <span className={styles.sectionTabIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
            </ArdoLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
