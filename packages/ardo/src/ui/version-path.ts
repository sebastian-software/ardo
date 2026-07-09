import { normalizeBasePath } from "../config/versioning"

export function getVersionedPath(pathname: string, currentBase: string, targetBase: string) {
  const relativePath = getPathWithinBase(pathname, currentBase)
  const normalizedTarget = normalizeBasePath(targetBase)
  if (relativePath === "/") {
    return normalizedTarget
  }

  return `${normalizedTarget.replace(/\/$/u, "")}${relativePath}`
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
