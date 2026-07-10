import { useLocation } from "react-router"
import generatedSidebarsModule from "virtual:ardo/generated-sidebars"

import type { SidebarItem as SidebarItemType } from "../config/types"

import { useArdoConfig } from "../runtime/hooks"
import { SidebarItems } from "./Sidebar"

const generatedSidebars = generatedSidebarsModule as Record<string, SidebarItemType[]>

export type ArdoGeneratedSidebarProps = {
  /** Top-level generated navigation section, such as "guide" or "api-reference". */
  section: string
}

export type ArdoGeneratedSidebarComponent = {
  ardoGeneratedSidebarItems?: (section: string) => SidebarItemType[]
} & typeof ArdoGeneratedSidebar

export function ArdoGeneratedSidebar({ section }: ArdoGeneratedSidebarProps) {
  const config = useArdoConfig()
  const location = useLocation()
  const localeId =
    config.i18n === false
      ? undefined
      : config.i18n?.locales.find((locale) => location.pathname.split("/").includes(locale.id))?.id
  const items = generatedSidebarItems(localeId == null ? section : `${localeId}:${section}`)
  if (items.length === 0) return null
  return <SidebarItems items={items} depth={0} />
}

function generatedSidebarItems(section: string): SidebarItemType[] {
  return generatedSidebars[section] ?? []
}

;(ArdoGeneratedSidebar as ArdoGeneratedSidebarComponent).ardoGeneratedSidebarItems =
  generatedSidebarItems
