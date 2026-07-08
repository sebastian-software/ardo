import type { ComponentProps, ReactNode } from "react"

import { NavLink } from "react-router"

import { BookOpenIcon } from "./icons"
import * as styles from "./Sidebar.css"

type RoutePath = ComponentProps<typeof NavLink>["to"]

export type SidebarRailItem = {
  key: string
  label: string
  to: RoutePath
  icon?: ReactNode
  active: boolean
}

export function SidebarRail({ items }: { items: SidebarRailItem[] }) {
  // The rail is always present as a layout element. It can be empty when a
  // layout intentionally renders no sidebar sections.
  if (items.length === 0) {
    return <div className={styles.sidebarRail} aria-hidden="true" />
  }

  return (
    <nav aria-label="Documentation sections" className={styles.sidebarRail}>
      <ul className={styles.sidebarRailList}>
        {items.map((item) => (
          <li key={item.key} className={styles.sidebarRailItem}>
            <NavLink
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                [styles.sidebarRailLink, (item.active || isActive) && "active"]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {resolveRailIcon(item)}
            </NavLink>
            <span className={styles.sidebarRailLabel} aria-hidden="true">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function resolveRailIcon(item: SidebarRailItem): ReactNode {
  if (item.icon !== undefined) return item.icon
  return <BookOpenIcon size={18} strokeWidth={1.8} />
}
