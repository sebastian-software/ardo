export type ArdoThemeMode = "dark" | "light" | "system"

export const ARDO_THEME_STORAGE_KEY = "ardo-theme"
export const ARDO_THEME_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const storedTheme = localStorage.getItem("${ARDO_THEME_STORAGE_KEY}");
    const theme = storedTheme === "dark" || storedTheme === "light" || storedTheme === "system" ? storedTheme : "system";
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  } catch {
  }
})();`

const isBrowser = typeof document !== "undefined"

export function getInitialThemeMode(): ArdoThemeMode {
  if (!isBrowser) return "system"
  const stored = localStorage.getItem(ARDO_THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : "system"
}

export function storeThemeMode(theme: ArdoThemeMode): void {
  localStorage.setItem(ARDO_THEME_STORAGE_KEY, theme)
}

export function applyThemeMode(theme: ArdoThemeMode): void {
  const root = document.documentElement
  const isDark = theme === "dark" || (theme === "system" && getSystemThemeQuery().matches)

  root.classList.toggle("dark", isDark)
  root.classList.toggle("light", !isDark)
}

export function subscribeSystemThemeChanges(theme: ArdoThemeMode): () => void {
  if (theme !== "system") {
    return noop
  }

  const query = getSystemThemeQuery()
  const handleChange = () => {
    applyThemeMode("system")
  }

  query.addEventListener("change", handleChange)
  return () => {
    query.removeEventListener("change", handleChange)
  }
}

function getSystemThemeQuery(): MediaQueryList {
  return globalThis.matchMedia("(prefers-color-scheme: dark)")
}

function isThemeMode(value: null | string): value is ArdoThemeMode {
  return value === "dark" || value === "light" || value === "system"
}

function noop() {
  // Non-system theme modes do not need a media-query cleanup callback.
}
