import type { ReactElement } from "react"

import generatedSidebarsModule, { sectionIndexes } from "virtual:ardo/generated-sidebars"

import type { ArdoConfig, SidebarItem } from "../config/types"

import { ArdoGeneratedSidebar } from "./GeneratedSidebar"
import { resolveSectionKind, resolveSectionLabel } from "./section-catalog"
import { ArdoSidebarSection, type ArdoSidebarSectionProps } from "./Sidebar"
import { getLocaleFromPath } from "./version-path"

const generatedSidebars = generatedSidebarsModule as Record<string, SidebarItem[]>
const generatedSectionIndexes: Partial<Record<string, string>> = sectionIndexes

/**
 * One `ArdoSidebarSection` per top-level route folder, so `<ArdoSidebar />`
 * without children needs no hand-written section list. Known folder names get
 * their label and icon from the section catalog; the order follows
 * `sidebar.sectionOrder`, then the catalog, then the folder name.
 */
export function createGeneratedSidebarSections(
  config: Pick<ArdoConfig, "i18n" | "sidebar">,
  pathname: string
): Array<ReactElement<ArdoSidebarSectionProps>> {
  const localeIds =
    config.i18n === false || config.i18n == null
      ? []
      : config.i18n.locales.map((locale) => locale.id)
  const localeId = getLocaleFromPath(pathname, localeIds)
  const prefix = localeId == null ? "" : `${localeId}:`
  const sections = Object.keys(generatedSidebars)
    .filter((key) => (prefix === "" ? !key.includes(":") : key.startsWith(prefix)))
    .map((key) => ({
      id: key.slice(prefix.length),
      to: generatedSectionIndexes[key] ?? firstLink(generatedSidebars[key]),
    }))
    .filter((section): section is { id: string; to: string } => section.to != null)

  sortSections(sections, config.sidebar?.sectionOrder)

  return sections.map(({ id, to }) => (
    <ArdoSidebarSection
      key={id}
      id={id}
      label={resolveSectionLabel(id)}
      to={to}
      match={sectionMatcher(localeId == null ? `/${id}` : `/${localeId}/${id}`)}
    >
      <ArdoGeneratedSidebar section={id} />
    </ArdoSidebarSection>
  ))
}

function firstLink(items: SidebarItem[] | undefined): string | undefined {
  for (const item of items ?? []) {
    if (item.link != null && item.link !== "") return item.link
    const nested = firstLink(item.items)
    if (nested != null) return nested
  }
  return undefined
}

function sortSections(sections: Array<{ id: string }>, sectionOrder: string[] | undefined): void {
  const explicitRank = new Map((sectionOrder ?? []).map((id, index) => [id, index]))
  const rank = (id: string): [number, number] => [
    explicitRank.get(id) ?? Number.MAX_SAFE_INTEGER,
    resolveSectionKind(id)?.rank ?? Number.MAX_SAFE_INTEGER,
  ]
  sections.sort((left, right) => {
    const [leftExplicit, leftCatalog] = rank(left.id)
    const [rightExplicit, rightCatalog] = rank(right.id)
    return (
      leftExplicit - rightExplicit || leftCatalog - rightCatalog || left.id.localeCompare(right.id)
    )
  })
}

function sectionMatcher(root: string): (pathname: string) => boolean {
  return (pathname) => pathname === root || pathname.startsWith(`${root}/`)
}
