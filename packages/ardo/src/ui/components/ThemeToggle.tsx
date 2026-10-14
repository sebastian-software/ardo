import { useEffect, useState, useSyncExternalStore } from "react"

import { ChromeIcon } from "../chrome-icons"
import {
  applyThemeMode,
  type ArdoThemeMode,
  getConfiguredThemeMode,
  getInitialThemeMode,
  storeThemeMode,
  subscribeSystemThemeChanges,
} from "../theme-mode"
import * as styles from "./ThemeToggle.css"

export function ArdoThemeToggle() {
  const [theme, setTheme] = useState<ArdoThemeMode>(getInitialThemeMode)
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
    setTheme(nextTheme)
    storeThemeMode(nextTheme)
    applyThemeMode(nextTheme)
  }

  if (!mounted) {
    return (
      <button type="button" className={styles.themeToggle} aria-label="Toggle theme">
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
          ? `Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} theme`
          : `Theme fixed to ${configuredTheme}`
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
