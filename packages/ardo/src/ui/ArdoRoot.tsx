import { cloneElement, isValidElement, type ReactNode, useMemo } from "react"
import { Outlet, useLocation } from "react-router"

import type { ArdoConfig, SidebarItem } from "../config/types"

import { ArdoProvider, type ArdoSiteConfig, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoFooter, type ArdoFooterProps } from "./Footer"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { ArdoLayout } from "./Layout"
import * as layoutStyles from "./Layout.css"
import { ArdoSidebar, type ArdoSidebarProps } from "./Sidebar"

// =============================================================================
// ArdoRoot Component
// =============================================================================

export interface ArdoRootProps {
  /** Ardo config (from virtual:ardo/config) */
  config: ArdoConfig
  /** Sidebar data (from virtual:ardo/sidebar) */
  sidebar: SidebarItem[]
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
  if (header != null) {
    return enhanceHeaderWithMobileMenuContent(header, mobileMenuContent)
  }
  return (
    <ArdoHeader
      {...headerProps}
      mobileMenuContent={headerProps?.mobileMenuContent ?? mobileMenuContent}
    />
  )
}

function resolveLayoutClassName(className: string | undefined, isHomePage: boolean): string {
  if (className != null) return className
  return isHomePage ? `${layoutStyles.layout} ${layoutStyles.home}` : layoutStyles.layout
}

export function ArdoRoot({
  config,
  sidebar,
  header,
  sidebarContent,
  footer,
  headerProps,
  sidebarProps,
  footerProps,
  editLink,
  lastUpdated,
  tocLabel,
  className,
  children,
}: ArdoRootProps) {
  const location = useLocation()
  const isHomePage = location.pathname === "/" || location.pathname === ""
  const resolvedSidebar = isHomePage
    ? undefined
    : (sidebarContent ?? <ArdoSidebar {...sidebarProps} />)
  const resolvedHeader = resolveRootHeader(
    header,
    headerProps,
    isHomePage ? undefined : resolvedSidebar
  )

  const siteConfig = useMemo<ArdoSiteConfig>(
    () => ({ editLink, lastUpdated, tocLabel }),
    [editLink, lastUpdated, tocLabel]
  )

  const content = (
    <ArdoProvider config={config} sidebar={sidebar}>
      <ArdoLayout
        className={resolveLayoutClassName(className, isHomePage)}
        header={resolvedHeader}
        sidebar={resolvedSidebar}
        footer={footer ?? <ArdoFooter {...footerProps} />}
      >
        {children ?? <Outlet />}
      </ArdoLayout>
    </ArdoProvider>
  )

  const hasSiteConfig =
    editLink !== undefined || lastUpdated !== undefined || (tocLabel ?? "") !== ""
  return hasSiteConfig ? (
    <ArdoSiteConfigProvider value={siteConfig}>{content}</ArdoSiteConfigProvider>
  ) : (
    content
  )
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
