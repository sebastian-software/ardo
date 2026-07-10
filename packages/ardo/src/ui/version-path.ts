import { normalizeBasePath } from "../config/versioning"

export function getVersionedPath(pathname: string, currentBase: string, targetBase: string) {
  const relativePath = getPathWithinBase(pathname, currentBase)
  const normalizedTarget = normalizeBasePath(targetBase)
  if (relativePath === "/") {
    return normalizedTarget
  }

  return `${normalizedTarget.replace(/\/$/u, "")}${relativePath}`
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

function getPathWithinBase(pathname: string, base: string) {
  const normalizedBase = normalizeBasePath(base).replace(/\/$/u, "")
  if (normalizedBase === "") {
    return pathname
  }

  if (pathname === normalizedBase) {
    return "/"
  }

  if (pathname.startsWith(`${normalizedBase}/`)) {
    return pathname.slice(normalizedBase.length) || "/"
  }

  return "/"
}
