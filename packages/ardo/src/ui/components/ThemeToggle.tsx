import { useState, useEffect } from "react"
import { SunIcon, MoonIcon, MonitorIcon } from "../icons"

type Theme = "light" | "dark" | "system"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem("ardo-theme") as Theme | null
    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      applyTheme("system")
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(nextTheme)
    localStorage.setItem("ardo-theme", nextTheme)
    applyTheme(nextTheme)
  }

  if (!mounted) {
    return (
      <button className="ardo-theme-toggle" aria-label="Toggle theme">
        <span className="ardo-theme-icon">
          <SunIcon size={20} />
        </span>
      </button>
    )
  }

  return (
    <button
      className="ardo-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} theme`}
    >
      <span className="ardo-theme-icon">
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
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", isDark)
    root.classList.toggle("light", !isDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }
}
