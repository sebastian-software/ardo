import { type ComponentType, createContext, use } from "react"

/** One `<meta>`, `<title>`, or `<link>` description, as returned by a `meta` export. */
export type ArdoMetaDescriptor =
  | { charSet: string }
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { httpEquiv: string; content: string }
  | { tagName: "link"; [attribute: string]: string }
  | { tagName: "meta"; [attribute: string]: string }

/** Signature of the optional `meta` export of a route module or `app/root.tsx`. */
export type ArdoMetaFunction = () => ArdoMetaDescriptor[]

/** An error the page renders instead of its content, such as a missing route. */
export type ArdoPageError = { status: number; message?: string } | Error

/** Whether the page error is a missing page rather than a render error. */
export function isArdoNotFound(error: ArdoPageError | undefined): boolean {
  return error != null && !(error instanceof Error) && error.status === 404
}

/** What Ardo knows about the page it renders. */
export type ArdoPage = {
  /** Public base path of the site, with leading and trailing slash. */
  base: string
  /** Page component, or the error component when `error` is set. */
  component?: ComponentType
  /** Error that replaced the page content. */
  error?: ArdoPageError
  /** The route module's `handle` export. */
  handle?: unknown
  /** Path of the page without the base path, starting with a slash. */
  path: string
  /** Source identity and modification time supplied by the route table. */
  source?: { relativePath: string; lastUpdated: number }
}

export const ArdoPageContext = createContext<ArdoPage>({ base: "/", path: "/" })

export function useArdoPage(): ArdoPage {
  return use(ArdoPageContext)
}

/** Path of the current page without the base path, for example `/guide/intro`. */
export function useArdoPath(): string {
  return use(ArdoPageContext).path
}

/** Resolve an internal link target against the current page and the base path. */
export function useArdoHref(to: string): string {
  const { base, path } = use(ArdoPageContext)
  return resolveArdoHref(to, { base, path })
}

/** Whether `to` names the current page, or with `end: false` one of its ancestors. */
export function useIsActivePath(to: string, end = false): boolean {
  const { base, path } = use(ArdoPageContext)
  const internal = toInternalPath(to, { base, path })
  if (internal == null) return false
  const target = trimTrailingSlash(internal)
  const current = trimTrailingSlash(path)
  if (current === target) return true
  if (end) return false
  return target === "/" ? false : current.startsWith(`${target}/`)
}

/** Load another page. Pages are static documents, so this is a full navigation. */
export function navigateTo(href: string): void {
  globalThis.location.assign(href)
}

/**
 * Resolve a link target to the URL an `<a>` needs. Pages live in folders, so
 * page links end with a slash and reach the page without a host redirect.
 */
export function resolveArdoHref(to: string, page: { base: string; path: string }): string {
  if (to === "" || isExternal(to) || to.startsWith("#") || to.startsWith("?")) return to
  const target = toInternalPath(to, page)
  if (target == null) return to
  const base = normalizeBase(page.base)
  const pathname = target === "/" ? base : `${base.slice(0, -1)}${withPageSlash(target)}`
  return pathname + to.slice(firstIndexOf(to, ["?", "#"]))
}

export function normalizeBase(base: string): string {
  const trimmed = base.replaceAll(/^\/+|\/+$/gu, "")
  return trimmed === "" ? "/" : `/${trimmed}/`
}

export function normalizePath(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

/** Add the folder slash to page paths; paths to files such as `llms.txt` stay as they are. */
function withPageSlash(pathname: string): string {
  if (pathname.endsWith("/")) return pathname
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1)
  return lastSegment.includes(".") ? pathname : `${pathname}/`
}

/**
 * Internal path of a link target without the base path, query, or hash, or
 * `undefined` for external URLs. A trailing slash in the target is kept.
 */
function toInternalPath(to: string, page: { base: string; path: string }): string | undefined {
  if (isExternal(to)) return undefined
  const pathPart = to.slice(0, firstIndexOf(to, ["?", "#"]))
  if (pathPart === "") return page.path
  if (pathPart.startsWith("/")) return normalizeDots(pathPart)
  const directory = page.path.endsWith("/") ? page.path : page.path.replace(/[^/]*$/u, "")
  return normalizeDots(`${directory}${pathPart}`)
}

function isExternal(to: string): boolean {
  return /^[a-z][\d+.a-z-]*:/iu.test(to) || to.startsWith("//")
}

function firstIndexOf(value: string, characters: string[]): number {
  const indices = characters.map((character) => value.indexOf(character)).filter((i) => i !== -1)
  return indices.length === 0 ? value.length : Math.min(...indices)
}

function normalizeDots(pathname: string): string {
  const segments: string[] = []
  for (const segment of pathname.split("/")) {
    if (segment === "..") segments.pop()
    else if (segment !== "." && segment !== "") segments.push(segment)
  }
  const trailing = pathname.endsWith("/") && segments.length > 0 ? "/" : ""
  return `/${segments.join("/")}${trailing}`
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname
}
