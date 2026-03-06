import { useEffect, useState } from "react"

import { MonitorIcon, MoonIcon, SunIcon } from "../icons"
import * as styles from "./ThemeToggle.css"

type Theme = "dark" | "light" | "system"

const isBrowser = typeof document !== "undefined"

function getInitialTheme(): Theme {
  if (!isBrowser) return "system"
  const stored = localStorage.getItem("ardo-theme") as null | Theme
  return stored ?? "system"
}

export function ArdoThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [mounted] = useState(isBrowser)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(nextTheme)
    localStorage.setItem("ardo-theme", nextTheme)
    applyTheme(nextTheme)
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

function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === "system") {
    const isDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", isDark)
    root.classList.toggle("light", !isDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }
}
