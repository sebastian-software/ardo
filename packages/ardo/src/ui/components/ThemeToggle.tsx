import { useEffect, useState, useSyncExternalStore } from "react"

import { useArdoLabels } from "../../runtime/hooks"

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

/** A button that switches between light and dark mode and remembers the choice. */
export function ArdoThemeToggle() {
  const labels = useArdoLabels().theme
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
