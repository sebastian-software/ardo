import { type ReactNode } from "react"
import { Links, Meta, Scripts, ScrollRestoration } from "react-router"
import { useConfig } from "../runtime/hooks"

// =============================================================================
// RootLayout Component (html/head/body shell)
// =============================================================================

export interface RootLayoutProps {
  children: ReactNode
  /** Favicon URL (renders <link rel="icon">) */
  favicon?: string
  /** Language attribute for <html> (default: from config or "en") */
  lang?: string
}

/**
 * Default HTML shell for Ardo sites. Replaces the boilerplate `Layout` export
 * that every root.tsx must define for React Router.
 *
 * @example Basic usage
 * ```tsx
 * // app/root.tsx
 * export { RootLayout as Layout } from "ardo/ui"
 * ```
 *
 * @example With favicon
 * ```tsx
 * import logo from "./assets/logo.svg"
 * export const Layout = (props) => <RootLayout favicon={logo} {...props} />
 * ```
 */
export function RootLayout({ children, favicon, lang }: RootLayoutProps) {
  const config = useConfig()
  const resolvedLang = lang ?? config.lang ?? "en"

  return (
    <html lang={resolvedLang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {favicon && <link rel="icon" type="image/svg+xml" href={favicon} />}
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// =============================================================================
// Layout Component
// =============================================================================

export interface LayoutProps {
  /** Header content */
  header?: ReactNode
  /** Sidebar content */
  sidebar?: ReactNode
  /** Footer content */
  footer?: ReactNode
  /** Main content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Layout component with explicit slot props.
 *
 * @example
 * ```tsx
 * <Layout
 *   header={<Header logo="/logo.svg" title="Ardo" nav={...} />}
 *   sidebar={<Sidebar>...</Sidebar>}
 *   footer={<Footer message="MIT License" />}
 * >
 *   <Outlet />
 * </Layout>
 * ```
 */
export function Layout({ header, sidebar, footer, children, className }: LayoutProps) {
  return (
    <div className={className ?? "ardo-layout"}>
      <a href="#main-content" className="ardo-skip-link">
        Skip to content
      </a>
      {header}
      <div className="ardo-layout-container">
        {sidebar}
        <main id="main-content" className="ardo-main">
          {children}
        </main>
      </div>
      {footer}
    </div>
  )
}
