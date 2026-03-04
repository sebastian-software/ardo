import { type ReactNode, useContext } from "react"
import { Links, Meta, Scripts, ScrollRestoration } from "react-router"
import { ArdoContext } from "../runtime/hooks"
import * as styles from "./Layout.css"

// =============================================================================
// RootLayout Component (html/head/body shell)
// =============================================================================

const ARDO_FAVICON =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20style%3D%22stroke-linecap%3Around%3Bstroke-linejoin%3Around%22%20viewBox%3D%220%200%20600%20600%22%3E%3Cdefs%3E%3Csymbol%20id%3D%22a%22%20overflow%3D%22visible%22%3E%3Cpath%20d%3D%22M300%20300%20151%20128l2%20178-41%2094h93c-35%2032-55%2068-63%20107m63-106%2095%2081m-32-96%2028%2088%22%2F%3E%3Cellipse%20cx%3D%22222%22%20cy%3D%22327%22%20fill%3D%22%2300655a%22%20rx%3D%2220%22%20ry%3D%2233%22%2F%3E%3Ccircle%20cx%3D%22227%22%20cy%3D%22324%22%20r%3D%2271%22%2F%3E%3C%2Fsymbol%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%2300655a%22%20stroke-width%3D%2216%22%3E%3Cpath%20d%3D%22M155%20318c2-70%2066-126%20145-126s143%2056%20145%20126%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22290%22%20r%3D%22270%22%2F%3E%3Cuse%20href%3D%22%23a%22%2F%3E%3Cuse%20href%3D%22%23a%22%20transform%3D%22matrix%28-1%200%200%201%20600%200%29%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"

export interface ArdoRootLayoutProps {
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
export function ArdoRootLayout({ children, favicon, lang }: ArdoRootLayoutProps) {
  // Use optional context (RootLayout renders before ArdoProvider is available)
  const context = useContext(ArdoContext)
  const resolvedLang = lang ?? context?.config.lang ?? "en"

  return (
    <html lang={resolvedLang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href={favicon ?? ARDO_FAVICON} />
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

export interface ArdoLayoutProps {
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
export function ArdoLayout({ header, sidebar, footer, children, className }: ArdoLayoutProps) {
  return (
    <div className={className ?? styles.layout}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      {header}
      <div className={styles.layoutContainer}>
        {sidebar}
        <main id="main-content" className={styles.main}>
          {children}
        </main>
      </div>
      {footer}
    </div>
  )
}
