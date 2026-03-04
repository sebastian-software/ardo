import { cloneElement, isValidElement, type ReactNode } from "react"
import { Outlet, useLocation } from "react-router"
import { ArdoProvider } from "../runtime/hooks"
import type { ArdoConfig, SidebarItem } from "../config/types"
import { ArdoLayout } from "./Layout"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { ArdoSidebar, type ArdoSidebarProps } from "./Sidebar"
import { ArdoFooter, type ArdoFooterProps } from "./Footer"
import * as layoutStyles from "./Layout.css"

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
 *     />
 *   )
 * }
 * ```
 */
export function ArdoRoot({
  config,
  sidebar,
  header,
  sidebarContent,
  footer,
  headerProps,
  sidebarProps,
  footerProps,
  className,
  children,
}: ArdoRootProps) {
  const location = useLocation()
  const isHomePage = location.pathname === "/" || location.pathname === ""

  const resolvedSidebar = isHomePage
    ? undefined
    : (sidebarContent ?? <ArdoSidebar {...sidebarProps} />)
  const inferredMobileMenuContent = isHomePage ? undefined : resolvedSidebar
  const resolvedHeader = header ? (
    enhanceHeaderWithMobileMenuContent(header, inferredMobileMenuContent)
  ) : (
    <ArdoHeader
      {...headerProps}
      mobileMenuContent={headerProps?.mobileMenuContent ?? inferredMobileMenuContent}
    />
  )
  const resolvedFooter = footer ?? <ArdoFooter {...footerProps} />
  const resolvedClassName =
    className ?? (isHomePage ? `${layoutStyles.layout} ${layoutStyles.home}` : layoutStyles.layout)

  return (
    <ArdoProvider config={config} sidebar={sidebar}>
      <ArdoLayout
        className={resolvedClassName}
        header={resolvedHeader}
        sidebar={resolvedSidebar}
        footer={resolvedFooter}
      >
        {children ?? <Outlet />}
      </ArdoLayout>
    </ArdoProvider>
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
