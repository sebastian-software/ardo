import { use } from "react"
import { ArdoConfigContext, ArdoContext, useArdoConfig } from "./hooks"
import { useArdoPath } from "./page-context"

/** The active route locale, or the site's language when i18n is disabled. */
export function useArdoLocale(): string {
  const context = use(ArdoContext)
  const siteConfig = use(ArdoConfigContext)
  const config = context?.config ?? siteConfig
  const path = useArdoPath()
  const i18n = config?.i18n
  if (i18n === false || i18n == null) return config?.lang ?? "en"
  const segment = path.split("/")[1]
  return i18n.locales.find((locale) => locale.id === segment)?.id ?? i18n.defaultLocale
}

/** Internal destination shared by default and site-owned navigation. */
export function useArdoHomePath(): string {
  const { i18n } = useArdoConfig()
  const locale = useArdoLocale()
  return i18n === false || i18n == null ? "/" : `/${locale}/`
}
