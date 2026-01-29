import { useState, useEffect } from "react"

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
          <SunIcon />
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
        {theme === "light" && <SunIcon />}
        {theme === "dark" && <MoonIcon />}
        {theme === "system" && <SystemIcon />}
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

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
