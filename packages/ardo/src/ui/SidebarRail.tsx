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
  if (items.length === 0) return null

  return (
    <nav aria-label="Documentation sections" className={styles.sidebarRail}>
      <ul className={styles.sidebarRailList}>
        {items.map((item, index) => (
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
                {resolveRailIcon(item, index)}
              </NavLink>
            ) : (
              <span className={styles.sidebarRailLink} aria-label={item.label}>
                {resolveRailIcon(item, index)}
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

export function getDataRailItems(items: SidebarItemType[], currentPath: string): SidebarRailItem[] {
  return items.map((item, index) => ({
    key: item.link ?? `${item.text}-${String(index)}`,
    label: item.text,
    to: item.link ?? findFirstItemLink(item.items ?? []),
    iconKey: item.icon,
    active: item.link === currentPath || hasActiveDataChild(item, currentPath),
  }))
}

export function getTextLabel(children: ReactNode, fallback: string): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  return fallback
}

function findFirstItemLink(items: SidebarItemType[]): string | undefined {
  for (const item of items) {
    if ((item.link ?? "") !== "") return item.link
    const nested = findFirstItemLink(item.items ?? [])
    if (nested !== undefined) return nested
  }
  return undefined
}

function hasActiveDataChild(item: SidebarItemType, currentPath: string): boolean {
  return (item.items ?? []).some(
    (child) => child.link === currentPath || hasActiveDataChild(child, currentPath)
  )
}

function resolveRailIcon(item: SidebarRailItem, index: number): ReactNode {
  if (item.icon !== undefined) return item.icon
  const iconKey = item.iconKey ?? inferIconKey(item.label, index)
  const Icon = iconByKey[iconKey]
  return <Icon size={18} strokeWidth={1.8} />
}

function inferIconKey(label: string, index: number): NonNullable<SidebarItemType["icon"]> {
  const normalized = label.toLowerCase()
  if (normalized.includes("api")) return "api"
  if (normalized.includes("component")) return "components"
  if (normalized.includes("custom") || normalized.includes("config")) return "settings"
  if (normalized.includes("deploy") || normalized.includes("trouble")) return "tools"
  if (normalized.includes("writing") || normalized.includes("markdown")) return "docs"
  if (normalized.includes("intro") || normalized.includes("guide")) return "guide"
  return fallbackIconKeys[index % fallbackIconKeys.length]
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

const fallbackIconKeys = [
  "guide",
  "docs",
  "settings",
  "tools",
  "components",
  "box",
] satisfies Array<NonNullable<SidebarItemType["icon"]>>
