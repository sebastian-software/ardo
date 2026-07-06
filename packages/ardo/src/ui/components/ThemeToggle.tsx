import { useEffect, useState, useSyncExternalStore } from "react"

import { MonitorIcon, MoonIcon, SunIcon } from "../icons"
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
  const configuredTheme = mounted ? getConfiguredThemeMode() : "system"

  useEffect(() => {
    if (!mounted) return
    applyThemeMode(theme)
    return subscribeSystemThemeChanges(theme)
  }, [mounted, theme])

  const toggleTheme = () => {
    const nextTheme: ArdoThemeMode =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(nextTheme)
    storeThemeMode(nextTheme)
    applyThemeMode(nextTheme)
  }

  if (mounted && configuredTheme !== "system") {
    return null
  }

  if (!mounted) {
    return (
      <button type="button" className={styles.themeToggle} aria-label="Toggle theme">
        <span className={styles.themeIcon}>
          <SunIcon size={20} />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} theme`}
    >
      <span className={styles.themeIcon}>
        {theme === "light" && <SunIcon size={20} />}
        {theme === "dark" && <MoonIcon size={20} />}
        {theme === "system" && <MonitorIcon size={20} />}
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
