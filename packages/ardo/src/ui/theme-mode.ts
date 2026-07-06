export type ArdoThemeMode = "dark" | "light" | "system"

export const ARDO_THEME_STORAGE_KEY = "ardo-theme"

export function createThemeBootstrapScript(theme: ArdoThemeMode = "system"): string {
  return `(() => {
  try {
    const configuredTheme = ${JSON.stringify(theme)};
    if (configuredTheme === "light" || configuredTheme === "dark") {
      localStorage.removeItem("${ARDO_THEME_STORAGE_KEY}");
    }
    const storedTheme = configuredTheme === "system" ? localStorage.getItem("${ARDO_THEME_STORAGE_KEY}") : configuredTheme;
    const theme = storedTheme === "dark" || storedTheme === "light" || storedTheme === "system" ? storedTheme : "system";
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.dataset.ardoTheme = configuredTheme;
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  } catch {
  }
})();`
}

const isBrowser = typeof document !== "undefined"

export const ARDO_THEME_BOOTSTRAP_SCRIPT = createThemeBootstrapScript()

export function getInitialThemeMode(): ArdoThemeMode {
  if (!isBrowser) return "system"
  const configured = getConfiguredThemeMode()
  if (configured !== "system") return configured
  const stored = localStorage.getItem(ARDO_THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : "system"
}

export function storeThemeMode(theme: ArdoThemeMode): void {
  if (getConfiguredThemeMode() !== "system") {
    localStorage.removeItem(ARDO_THEME_STORAGE_KEY)
    return
  }
  localStorage.setItem(ARDO_THEME_STORAGE_KEY, theme)
}

export function applyThemeMode(theme: ArdoThemeMode): void {
  const root = document.documentElement
  const configured = getConfiguredThemeMode()
  const resolvedTheme = configured === "system" ? theme : configured
  const isDark =
    resolvedTheme === "dark" || (resolvedTheme === "system" && getSystemThemeQuery().matches)

  root.classList.toggle("dark", isDark)
  root.classList.toggle("light", !isDark)
}

export function subscribeSystemThemeChanges(theme: ArdoThemeMode): () => void {
  const configured = getConfiguredThemeMode()
  const resolvedTheme = configured === "system" ? theme : configured
  if (resolvedTheme !== "system") {
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

export function getConfiguredThemeMode(): ArdoThemeMode {
  if (!isBrowser) return "system"
  const configured = document.documentElement.dataset.ardoTheme ?? null
  return isThemeMode(configured) ? configured : "system"
}

function noop() {
  // Non-system theme modes do not need a media-query cleanup callback.
}
