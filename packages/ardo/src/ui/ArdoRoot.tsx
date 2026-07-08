import { cloneElement, isValidElement, type ReactNode, useMemo } from "react"
import { Outlet, useLocation, useMatches } from "react-router"

import type { ArdoConfig, ArdoContextItem, SidebarItem } from "../config/types"

import { createBrandThemeCss } from "../config/brand"
import { ArdoProvider, type ArdoSiteConfig, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoFooter, type ArdoFooterProps } from "./Footer"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { type ArdoLabelsInput, resolveArdoLabels } from "./labels"
import { ArdoLayout } from "./Layout"
import * as layoutStyles from "./Layout.css"
import { ArdoSidebar, type ArdoSidebarProps } from "./Sidebar"

// =============================================================================
// ArdoRoot Component
// =============================================================================

export type ArdoRootProps = {
  /** Ardo config (from virtual:ardo/config) */
  config: ArdoConfig
  /**
   * Sidebar data.
   *
   * - `SidebarItem[]` — a single sidebar shown for every non-bare route
   *   (from `virtual:ardo/sidebar`, back-compat).
   * - `Record<string, SidebarItem[]>` — a per-context sidebar map
   *   (from `virtual:ardo/sidebars`). The active context's sidebar is
   *   shown; the key matches the `id` of the matching `ArdoContextItem`.
   */
  sidebar: Record<string, SidebarItem[]> | SidebarItem[]
  /**
   * Top-level navigation contexts shown in the sidebar rail. When provided,
   * the rail renders these as world-switcher items and `sidebar` is treated
   * as a map keyed by context id.
   */
  contexts?: ArdoContextItem[]
  /** Custom header element (overrides auto-generated header) */
  header?: ReactNode
  /** Custom sidebar element (overrides auto-generated sidebar) */
  sidebarContent?: ReactNode
  /** Custom footer element (overrides auto-generated footer) */
  footer?: ReactNode
  /** Props passed to auto-generated ArdoHeader (ignored when header is provided) */
  headerProps?: ArdoHeaderProps
  /** Props passed to auto-generated ArdoSidebar (ignored when sidebarContent is provided) */
  sidebarProps?: ArdoSidebarProps
  /** Props passed to auto-generated ArdoFooter (ignored when footer is provided) */
  footerProps?: ArdoFooterProps
  /** Edit link configuration (applied site-wide via ArdoSiteConfig) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (applied site-wide via ArdoSiteConfig) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  /** UI chrome labels and aria text, merged with English defaults. */
  labels?: ArdoLabelsInput
  /** TOC label (applied site-wide via ArdoSiteConfig) */
  tocLabel?: string
  /** Additional CSS classes for the layout */
  className?: string
  /** Content to render (defaults to <Outlet />) */
  children?: ReactNode
}

/**
 * All-in-one root component that combines ArdoProvider, Layout, Header,
 * Sidebar, Footer, and homepage detection into a single component.
 *
 * @example Minimal usage
 * ```tsx
 * import config from "virtual:ardo/config"
 * import sidebar from "virtual:ardo/sidebar"
 *
 * export default function Root() {
 *   return <ArdoRoot config={config} sidebar={sidebar} />
 * }
 * ```
 *
 * @example With custom nav and footer overrides
 * ```tsx
 * export default function Root() {
 *   return (
 *     <ArdoRoot
 *       config={config}
 *       sidebar={sidebar}
 *       headerProps={{
 *         nav: (
 *           <Nav>
 *             <NavLink to="/guide">Guide</NavLink>
 *             <NavLink to="/api">API</NavLink>
 *           </Nav>
 *         ),
 *       }}
 *       footerProps={{
 *         message: "Released under the MIT License.",
 *       }}
 *       editLink={{
 *         pattern: "https://github.com/user/repo/edit/main/docs/:path",
 *         text: "Edit this page on GitHub",
 *       }}
 *       lastUpdated={{ enabled: true }}
 *     />
 *   )
 * }
 * ```
 */
function resolveRootHeader(
  header: ReactNode,
  headerProps: ArdoHeaderProps | undefined,
  mobileMenuContent: ReactNode
): ReactNode {
  if (header !== undefined) {
    return enhanceHeaderWithMobileMenuContent(header, mobileMenuContent)
  }
  return (
    <ArdoHeader
      {...headerProps}
      mobileMenuContent={headerProps?.mobileMenuContent ?? mobileMenuContent}
    />
  )
}

function resolveLayoutClassName(className: string | undefined, isBareLayout: boolean): string {
  if (className != null) return className
  return isBareLayout ? `${layoutStyles.layout} ${layoutStyles.home}` : layoutStyles.layout
}

function readLayoutHandle(handle: unknown): string | undefined {
  if (typeof handle !== "object" || handle === null) return undefined
  if (!("layout" in handle)) return undefined
  const { layout } = handle
  return typeof layout === "string" ? layout : undefined
}

function readChromeHandle(handle: unknown): boolean | undefined {
  if (typeof handle !== "object" || handle === null) return undefined
  if (!("chrome" in handle)) return undefined
  const { chrome } = handle
  return typeof chrome === "boolean" ? chrome : undefined
}

/**
 * Reads the React Router `handle` exports from every active route match and
 * returns the most specific `layout` value (the deepest match wins). MDX
 * routes get this export auto-generated from `frontmatter.layout`; .tsx
 * routes set it directly with `export const handle = { layout: "bare" }`.
 */
function useRouteLayout(): string | undefined {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const layout = readLayoutHandle(matches[i].handle)
    if (layout !== undefined) return layout
  }
  return undefined
}

function useRouteChrome(): boolean | undefined {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const chrome = readChromeHandle(matches[i].handle)
    if (chrome !== undefined) return chrome
  }
  return undefined
}

function contextMatchesPath(ctx: ArdoContextItem, pathname: string): boolean {
  if (ctx.match != null) {
    return typeof ctx.match === "string" ? pathname.startsWith(ctx.match) : ctx.match.test(pathname)
  }
  const firstSegment = ctx.href.split("/").find((segment) => segment !== "")
  if (firstSegment === undefined) return false
  const root = `/${firstSegment}`
  return pathname === root || pathname.startsWith(`${root}/`)
}

function findActiveContext(
  contexts: ArdoContextItem[] | undefined,
  pathname: string
): ArdoContextItem | undefined {
  return contexts?.find((ctx) => contextMatchesPath(ctx, pathname))
}

function resolveContextSidebar(
  sidebar: Record<string, SidebarItem[]> | SidebarItem[],
  activeContext: ArdoContextItem | undefined
): SidebarItem[] {
  if (Array.isArray(sidebar)) return sidebar
  if (activeContext == null) return []
  return sidebar[activeContext.id] ?? []
}

function ArdoBrandThemeStyle({ brand }: { brand: ArdoConfig["brand"] }) {
  const css = createBrandThemeCss(brand)
  if (css === undefined) return null
  return <style data-ardo-brand dangerouslySetInnerHTML={{ __html: css }} />
}

export function ArdoRoot({
  config,
  sidebar,
  contexts,
  header,
  sidebarContent,
  footer,
  headerProps,
  sidebarProps,
  footerProps,
  editLink,
  lastUpdated,
  labels,
  tocLabel,
  className,
  children,
}: ArdoRootProps) {
  const location = useLocation()
  const layout = useRouteLayout()
  const routeChrome = useRouteChrome()
  const showChrome = routeChrome !== false
  // Bare layout: no sidebar, no rail — used for the home page and any other
  // marketing-style routes (TSX or MDX). Falls back to the legacy hardcoded
  // home detection if a route hasn't opted in via `handle.layout`.
  const isBareLayout = layout === "bare" || location.pathname === "/" || location.pathname === ""
  const activeContext = useMemo(
    () => findActiveContext(contexts, location.pathname),
    [contexts, location.pathname]
  )
  const sidebarItems = useMemo(
    () => resolveContextSidebar(sidebar, activeContext),
    [sidebar, activeContext]
  )
  const resolvedHeaderProps =
    config.brand?.logo === undefined || headerProps?.logo !== undefined
      ? headerProps
      : { ...headerProps, logo: config.brand.logo }
  // Search lives in the header now. The sidebar no longer carries it.
  const resolvedSidebar = isBareLayout ? undefined : resolveSidebar(sidebarContent, sidebarProps)
  const resolvedHeader = showChrome
    ? resolveRootHeader(header, resolvedHeaderProps, isBareLayout ? undefined : resolvedSidebar)
    : null
  const resolvedFooter = showChrome ? (
    footer === undefined ? (
      <ArdoFooter {...footerProps} />
    ) : (
      footer
    )
  ) : null

  const siteConfig = useMemo<ArdoSiteConfig>(
    () => ({ editLink, labels: resolveArdoLabels(labels), lastUpdated, tocLabel }),
    [editLink, labels, lastUpdated, tocLabel]
  )

  const content = (
    <>
      <ArdoBrandThemeStyle brand={config.brand} />
      <ArdoProvider
        config={config}
        sidebar={sidebarItems}
        contexts={contexts}
        activeContextId={activeContext?.id}
      >
        <ArdoLayout
          className={resolveLayoutClassName(className, isBareLayout)}
          header={resolvedHeader}
          sidebar={resolvedSidebar}
          footer={resolvedFooter}
        >
          {children ?? <Outlet />}
        </ArdoLayout>
      </ArdoProvider>
    </>
  )

  const hasSiteConfig =
    editLink !== undefined ||
    labels !== undefined ||
    lastUpdated !== undefined ||
    (tocLabel ?? "") !== ""
  return hasSiteConfig ? (
    <ArdoSiteConfigProvider value={siteConfig}>{content}</ArdoSiteConfigProvider>
  ) : (
    content
  )
}

/**
 * Resolves the sidebar element. Custom content is passed through as-is;
 * when none is given, a default data-driven <ArdoSidebar> is created.
 */
function resolveSidebar(
  sidebarContent: ReactNode | undefined,
  sidebarProps: ArdoSidebarProps | undefined
): ReactNode {
  if (sidebarContent == null) {
    return <ArdoSidebar {...sidebarProps} />
  }
  if (isValidElement(sidebarContent)) {
    return sidebarContent
  }
  return <ArdoSidebar>{sidebarContent}</ArdoSidebar>
}

function enhanceHeaderWithMobileMenuContent(
  header: ReactNode,
  mobileMenuContent: ReactNode
): ReactNode {
  if (!isValidElement<ArdoHeaderProps>(header) || header.type !== ArdoHeader) {
    return header
  }

  const existingMobileMenuContent = header.props.mobileMenuContent
  if (existingMobileMenuContent !== undefined) {
    return header
  }

  return cloneElement(header, { mobileMenuContent })
}
