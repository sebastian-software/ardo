export function normalizeViteBaseForArdo(viteBase: string): string {
  const trimmedBase = viteBase.trim()
  if (trimmedBase === "" || trimmedBase === "./") {
    return "/"
  }

  if (trimmedBase.startsWith("http://") || trimmedBase.startsWith("https://")) {
    return normalizeBasePath(new URL(trimmedBase).pathname)
  }

  return normalizeBasePath(trimmedBase.startsWith("/") ? trimmedBase : `/${trimmedBase}`)
}

function normalizeBasePath(base: string): string {
  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`
}
