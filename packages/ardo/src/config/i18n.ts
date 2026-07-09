import type { I18nConfig } from "./types"

export function resolveI18nConfig(i18n: false | I18nConfig | undefined): false | I18nConfig {
  if (i18n == null || i18n === false) {
    return false
  }

  return {
    defaultLocale: i18n.defaultLocale,
    locales: i18n.locales.map((locale) => ({
      ...locale,
      label: locale.label ?? locale.id,
    })),
  }
}

export function getDefaultLocaleId(i18n: false | I18nConfig): string | undefined {
  return i18n === false ? undefined : i18n.defaultLocale
}
