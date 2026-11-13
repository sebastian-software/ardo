import { useEffect, useSyncExternalStore } from "react"

import { useArdoLabels } from "../../runtime/hooks"

import { ChromeIcon } from "../chrome-icons"
import {
  applyThemeMode,
  ARDO_THEME_STORAGE_KEY,
  type ArdoThemeMode,
  getConfiguredThemeMode,
  getInitialThemeMode,
  storeThemeMode,
  subscribeSystemThemeChanges,
} from "../theme-mode"
import * as styles from "./ThemeToggle.css"

/** A button that switches between light and dark mode and remembers the choice. */
export function ArdoThemeToggle() {
  const labels = useArdoLabels().theme
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const mounted = useSyncExternalStore(subscribeMounted, getClientMounted, getServerMounted)
  const configuredTheme = mounted ? getConfiguredThemeMode() : undefined
  const resolvedTheme = configuredTheme ?? theme

  useEffect(() => {
    if (!mounted) return
    applyThemeMode(resolvedTheme)
    return subscribeSystemThemeChanges(resolvedTheme)
  }, [mounted, resolvedTheme])

  const toggleTheme = () => {
    if (configuredTheme != null) {
      return
    }

    const nextTheme: ArdoThemeMode =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    selectTheme(nextTheme)
  }

  if (!mounted) {
    return (
      <button type="button" className={styles.themeToggle} aria-label={labels.toggle}>
        <span className={styles.themeIcon}>
          <ChromeIcon name="light-theme" />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      disabled={configuredTheme != null}
      aria-label={
        configuredTheme == null
          ? labels[theme === "light" ? "dark" : theme === "dark" ? "system" : "light"]
          : labels.fixed(configuredTheme)
      }
    >
      <span className={styles.themeIcon}>
        {resolvedTheme === "light" && <ChromeIcon name="light-theme" />}
        {resolvedTheme === "dark" && <ChromeIcon name="dark-theme" />}
        {resolvedTheme === "system" && <ChromeIcon name="system-theme" />}
      </span>
    </button>
  )
}

// Every toggle on the page (header, mobile drawer) shares one choice. The in-memory value keeps
// toggling working when storage is unavailable; storage stays the source between page loads.
let selectedTheme: ArdoThemeMode | undefined
const themeListeners = new Set<() => void>()

function selectTheme(theme: ArdoThemeMode) {
  selectedTheme = theme
  applyThemeMode(theme)
  notifyThemeListeners()
  // Last, so a storage failure still leaves the page on the chosen theme.
  storeThemeMode(theme)
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener)
  if (themeListeners.size === 1) globalThis.addEventListener("storage", handleThemeStorage)
  return () => {
    themeListeners.delete(listener)
    if (themeListeners.size > 0) return
    globalThis.removeEventListener("storage", handleThemeStorage)
    selectedTheme = undefined
  }
}

/** Another tab chose a theme; `key` is null when that tab cleared its storage. */
function handleThemeStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== ARDO_THEME_STORAGE_KEY) return
  selectedTheme = undefined
  notifyThemeListeners()
}

function notifyThemeListeners() {
  for (const listener of themeListeners) listener()
}

function getThemeSnapshot(): ArdoThemeMode {
  return selectedTheme ?? getInitialThemeMode()
}

function getServerThemeSnapshot(): ArdoThemeMode {
  return "system"
}

function subscribeMounted() {
  return noop
}

function getClientMounted() {
  return true
}

function getServerMounted() {
  return false
}

function noop() {
  // React's server snapshot subscription has no cleanup work.
}
