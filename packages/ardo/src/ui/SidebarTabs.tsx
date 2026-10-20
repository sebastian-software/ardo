import type { ComponentProps, ReactNode } from "react"

import { Link } from "react-router"

import * as styles from "./SidebarTabs.css"

type RoutePath = ComponentProps<typeof Link>["to"]

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
  return (
    <nav aria-label="Documentation sections" className={`ardo-sidebar-tabs ${styles.sectionTabs}`}>
      <ul className={styles.sectionTabList}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
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
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
