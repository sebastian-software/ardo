import { normalizeBasePath } from "../config/versioning"

/**
 * Address of the same page in another documentation version. `pagePath` is
 * the page path without the site base, as `useArdoPath()` reports it, and
 * `targetVersionPath` a resolved version path, which includes the deployment
 * base.
 */
export function getVersionHref(
  pagePath: string,
  targetVersionPath: string,
  options: { locale?: string; locales?: string[] } = {}
): string {
  if (options.locales != null) {
    const segments = pagePath.split("/").filter(Boolean)
    if (options.locale != null && segments[0] === options.locale) segments.shift()
    const targetLocale = options.locales.includes(options.locale ?? "")
      ? options.locale
      : options.locales[0]
    if (targetLocale != null) segments.unshift(targetLocale)
    pagePath = segments.length === 0 ? "/" : `/${segments.join("/")}`
  }
  const target = normalizeBasePath(targetVersionPath)
  return pagePath === "/" || pagePath === "" ? target : `${target.replace(/\/$/u, "")}${pagePath}`
}

export function getLocalizedPath(
  pathname: string,
  currentLocale: string,
  targetLocale: string
): string {
  const segments = pathname.split("/")
  const localeIndex = segments.indexOf(currentLocale)
  if (localeIndex === -1) return pathname

  segments[localeIndex] = targetLocale
  return segments.join("/") || "/"
}

export function getLocaleFromPath(pathname: string, localeIds: string[]): string | undefined {
  const segments = pathname.split("/")
  let activeLocale: string | undefined
  let activeLocaleIndex = Number.POSITIVE_INFINITY

  for (const localeId of localeIds) {
    const localeIndex = segments.indexOf(localeId)
    if (localeIndex !== -1 && localeIndex < activeLocaleIndex) {
      activeLocale = localeId
      activeLocaleIndex = localeIndex
    }
  }

  return activeLocale
}
