import { createContext } from "react"
import { useArdoPath } from "../runtime/page-context"

import type { DocumentationVersion } from "../config/types"

import { useArdoConfig } from "../runtime/hooks"
import { getLocaleFromPath } from "./version-path"

/**
 * True inside the mobile menu. The menu collects the site controls in one
 * section, so the sidebar it contains leaves out its own version control.
 */
export const ArdoMobilePanelContext = createContext(false)

export type VersionChoice = {
  versions: DocumentationVersion[]
  current: DocumentationVersion
  /** The first configured version. List versions newest first. */
  latest: DocumentationVersion
}

export function useVersionChoice(): VersionChoice | undefined {
  const versioning = useArdoConfig().versioning
  if (versioning === false || versioning == null || versioning.versions.length < 2) {
    return undefined
  }
  const current = versioning.versions.find((version) => version.id === versioning.current)
  const latest = versioning.versions[0]
  if (current == null || latest == null) return undefined
  return { versions: versioning.versions, current, latest }
}

export function useLocaleChoice() {
  const i18n = useArdoConfig().i18n
  const pathname = useArdoPath()
  if (i18n === false || i18n == null || i18n.locales.length < 2) return
  const current =
    getLocaleFromPath(
      pathname,
      i18n.locales.map((locale) => locale.id)
    ) ?? i18n.defaultLocale
  return { current, locales: i18n.locales }
}

export function versionLabel(version: DocumentationVersion): string {
  return version.label ?? version.id
}

/** Whether the build lists more than one documentation version. */
export function useHasVersionSwitcher(): boolean {
  return useVersionChoice() !== undefined
}

/** Whether the build has more than one locale. */
export function useHasLocaleSwitcher(): boolean {
  return useLocaleChoice() !== undefined
}
