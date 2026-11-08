/**
 * Spell a page path by the site's `trailingSlash` setting. Without a setting the path stays as it
 * is, which keeps Ardo's earlier output. The site root (`root`, the deployment base) always keeps
 * its slash, because it is a directory URL on every static host.
 */
export function spellPagePath(
  pathname: string,
  trailingSlash: boolean | undefined,
  root = "/"
): string {
  if (trailingSlash == null || pathname === "" || pathname === "/") return pathname
  const bare = pathname.replace(/\/+$/u, "")
  if (bare === "" || `${bare}/` === root) return pathname.endsWith("/") ? pathname : `${bare}/`
  return trailingSlash ? `${bare}/` : bare
}

/** {@link spellPagePath} for an absolute page URL; query and fragment are kept. */
export function spellPageUrl(url: string, trailingSlash: boolean | undefined, root = "/"): string {
  if (trailingSlash == null) return url
  const parsed = new URL(url)
  parsed.pathname = spellPagePath(parsed.pathname, trailingSlash, root)
  return parsed.href
}
