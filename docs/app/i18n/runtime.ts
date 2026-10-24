import { createI18n } from "@palamedes/core/compiled"
import { setClientI18n } from "@palamedes/runtime"

export const locales = ["en", "de", "fr", "es"] as const
export type Locale = (typeof locales)[number]
export function resolveLocale(value: string | undefined): Locale {
  return locales.find((locale) => locale === value) ?? "en"
}
const loaders = {
  en: () => import("./en.po"),
  de: () => import("./de.po"),
  fr: () => import("./fr.po"),
  es: () => import("./es.po"),
}
const instances = new Map<Locale, Promise<ReturnType<typeof createI18n>>>()
/** Each document has one immutable locale; parallel SSR never activates a shared instance. */
export function loadI18n(locale: Locale): Promise<ReturnType<typeof createI18n>> {
  const cached = instances.get(locale)
  if (cached != null) return cached
  const resource = loaders[locale]()
    .then(({ messages }) => {
      const i18n = createI18n({ locale, timeZone: "UTC" })
      i18n.load(locale, messages)
      return i18n
    })
    .catch((error: unknown) => {
      instances.delete(locale)
      throw error
    })
  instances.set(locale, resource)
  return resource
}
// Block hydration until the active catalog is ready. Other languages stay in separate chunks.
if (!import.meta.env.SSR) {
  setClientI18n(await loadI18n(resolveLocale(document.documentElement.lang)))
}
