import type { ComponentProps, ReactNode } from "react"

import { NavLink } from "react-router"

import type { ArdoContextItem, SidebarItem as SidebarItemType } from "../config/types"

import {
  BookOpenIcon,
  BoxIcon,
  CodeIcon,
  FileCodeIcon,
  FileTextIcon,
  PackageIcon,
  SettingsIcon,
  WrenchIcon,
} from "./icons"
import * as styles from "./Sidebar.css"

type RoutePath = ComponentProps<typeof NavLink>["to"]

export type SidebarRailItem = {
  key: string
  label: string
  to?: RoutePath
  icon?: ReactNode
  iconKey?: SidebarItemType["icon"]
  active: boolean
}

export function SidebarRail({ items }: { items: SidebarRailItem[] }) {
  // The rail is always present as a layout element so the sidebar looks the
  // same everywhere and authors can see where contexts plug in. Without
  // configured contexts it is just an empty surface (no navigation semantics).
  if (items.length === 0) {
    return <div className={styles.sidebarRail} aria-hidden="true" />
  }

  return (
    <nav aria-label="Documentation sections" className={styles.sidebarRail}>
      <ul className={styles.sidebarRailList}>
        {items.map((item) => (
          <li key={item.key} className={styles.sidebarRailItem}>
            {item.to !== undefined ? (
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
            ) : (
              <span className={styles.sidebarRailLink} aria-label={item.label}>
                {resolveRailIcon(item)}
              </span>
            )}
            <span className={styles.sidebarRailLabel} aria-hidden="true">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function getContextRailItems(
  contexts: ArdoContextItem[],
  activeId: string | undefined
): SidebarRailItem[] {
  return contexts.map((ctx) => ({
    key: ctx.id,
    label: ctx.label,
    to: ctx.href,
    iconKey: inferContextIconKey(ctx),
    active: ctx.id === activeId,
  }))
}

function inferContextIconKey(ctx: ArdoContextItem): NonNullable<SidebarItemType["icon"]> {
  const normalized = `${ctx.id} ${ctx.label}`.toLowerCase()
  if (normalized.includes("api")) return "api"
  if (normalized.includes("component")) return "components"
  if (normalized.includes("custom") || normalized.includes("config")) return "settings"
  if (normalized.includes("deploy") || normalized.includes("trouble")) return "tools"
  if (normalized.includes("guide") || normalized.includes("intro")) return "guide"
  if (normalized.includes("writing") || normalized.includes("markdown")) return "docs"
  return "book"
}

function resolveRailIcon(item: SidebarRailItem): ReactNode {
  if (item.icon !== undefined) return item.icon
  const Icon = iconByKey[item.iconKey ?? "book"]
  return <Icon size={18} strokeWidth={1.8} />
}

const iconByKey = {
  api: CodeIcon,
  book: BookOpenIcon,
  box: BoxIcon,
  code: FileCodeIcon,
  components: PackageIcon,
  docs: FileTextIcon,
  guide: BookOpenIcon,
  settings: SettingsIcon,
  tools: WrenchIcon,
} satisfies Record<NonNullable<SidebarItemType["icon"]>, typeof BookOpenIcon>
