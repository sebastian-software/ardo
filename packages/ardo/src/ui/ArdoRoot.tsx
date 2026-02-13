import { type ReactNode } from "react"
import { Outlet, useLocation } from "react-router"
import { ArdoProvider } from "../runtime/hooks"
import type { ArdoConfig, SidebarItem } from "../config/types"
import { Layout } from "./Layout"
import { Header, type HeaderProps } from "./Header"
import { Sidebar, type SidebarProps } from "./Sidebar"
import { Footer, type FooterProps } from "./Footer"

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
  /** Props passed to auto-generated Header (ignored when header is provided) */
  headerProps?: HeaderProps
  /** Props passed to auto-generated Sidebar (ignored when sidebarContent is provided) */
  sidebarProps?: SidebarProps
  /** Props passed to auto-generated Footer (ignored when footer is provided) */
  footerProps?: FooterProps
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

  const resolvedHeader = header ?? <Header {...headerProps} />
  const resolvedSidebar = isHomePage ? undefined : (sidebarContent ?? <Sidebar {...sidebarProps} />)
  const resolvedFooter = footer ?? <Footer {...footerProps} />
  const resolvedClassName = className ?? (isHomePage ? "ardo-layout ardo-home" : "ardo-layout")

  return (
    <ArdoProvider config={config} sidebar={sidebar}>
      <Layout
        className={resolvedClassName}
        header={resolvedHeader}
        sidebar={resolvedSidebar}
        footer={resolvedFooter}
      >
        {children ?? <Outlet />}
      </Layout>
    </ArdoProvider>
  )
}
