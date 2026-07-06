export type ArdoThemeMode = "dark" | "light" | "system"
export type ArdoThemePreference = "auto" | ArdoThemeMode

export const ARDO_THEME_STORAGE_KEY = "ardo-theme"

const ARDO_THEME_DATA_ATTRIBUTE = "ardoTheme"

export const ARDO_THEME_BOOTSTRAP_SCRIPT = getArdoThemeBootstrapScript()

export function resolveThemeBootstrapState(params: {
  preference?: ArdoThemePreference
  prefersDark: boolean
  storedTheme?: null | string
}): { clearsStorage: boolean; isDark: boolean; theme: ArdoThemeMode } {
  const preference = params.preference ?? "auto"
  const stored = isThemeMode(params.storedTheme) ? params.storedTheme : "system"
  const theme = preference === "auto" ? stored : preference
  const isDark = theme === "dark" || (theme === "system" && params.prefersDark)

  return {
    clearsStorage: preference !== "auto",
    isDark,
    theme,
  }
}

export function getArdoThemeBootstrapScript(preference: ArdoThemePreference = "auto"): string {
  return `(() => {
  try {
    const configuredTheme = ${JSON.stringify(preference)};
    document.documentElement.dataset.ardoTheme = configuredTheme;
    const storedTheme = localStorage.getItem("${ARDO_THEME_STORAGE_KEY}");
    const stored = storedTheme === "dark" || storedTheme === "light" || storedTheme === "system" ? storedTheme : "system";
    const theme = configuredTheme === "auto" ? stored : configuredTheme;
    if (configuredTheme !== "auto") {
      localStorage.removeItem("${ARDO_THEME_STORAGE_KEY}");
    }
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  } catch {
  }
})();`
}

const isBrowser = typeof document !== "undefined"

export function getInitialThemeMode(): ArdoThemeMode {
  const configured = getConfiguredThemeMode()
  if (configured != null) return configured
  if (!isBrowser) return "system"
  const stored = localStorage.getItem(ARDO_THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : "system"
}

export function storeThemeMode(theme: ArdoThemeMode): void {
  if (getConfiguredThemeMode() != null) {
    localStorage.removeItem(ARDO_THEME_STORAGE_KEY)
    return
  }

  localStorage.setItem(ARDO_THEME_STORAGE_KEY, theme)
}

export function applyThemeMode(theme: ArdoThemeMode): void {
  const configured = getConfiguredThemeMode()
  const resolvedTheme = configured ?? theme
  const root = document.documentElement
  const isDark =
    resolvedTheme === "dark" || (resolvedTheme === "system" && getSystemThemeQuery().matches)

  root.classList.toggle("dark", isDark)
  root.classList.toggle("light", !isDark)
}

export function subscribeSystemThemeChanges(theme: ArdoThemeMode): () => void {
  const configured = getConfiguredThemeMode()
  const resolvedTheme = configured ?? theme

  if (resolvedTheme !== "system") {
    return noop
  }

  const query = getSystemThemeQuery()
  query.addEventListener("change", handleSystemThemeChange)
  return () => {
    query.removeEventListener("change", handleSystemThemeChange)
  }
}

function handleSystemThemeChange(): void {
  applyThemeMode("system")
}

function getSystemThemeQuery(): MediaQueryList {
  return globalThis.matchMedia("(prefers-color-scheme: dark)")
}

export function getConfiguredThemeMode(): ArdoThemeMode | undefined {
  if (!isBrowser) return undefined
  const value = document.documentElement.dataset[ARDO_THEME_DATA_ATTRIBUTE]
  return isThemeMode(value) ? value : undefined
}

function isThemeMode(value: null | string | undefined): value is ArdoThemeMode {
  return value === "dark" || value === "light" || value === "system"
}

function noop() {
  // Non-system theme modes do not need a media-query cleanup callback.
}
