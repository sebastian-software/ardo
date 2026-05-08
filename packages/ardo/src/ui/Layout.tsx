import { type ReactNode, use } from "react"
import { Links, Meta, Scripts, ScrollRestoration } from "react-router"

import { ArdoContext } from "../runtime/hooks"
import { ARDO_FAVICON_DATA_URL } from "./favicon"
import * as styles from "./Layout.css"

// =============================================================================
// RootLayout Component (html/head/body shell)
// =============================================================================

export type ArdoRootLayoutProps = {
  children: ReactNode
  /** Favicon URL for the SVG icon link. Defaults to the generated /icon.svg asset. */
  favicon?: string
  /**
   * Base URL for generated icon files.
   * Set to `false` to render only the inline fallback favicon link.
   */
  iconBasePath?: false | string
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
export function ArdoRootLayout({
  children,
  favicon,
  iconBasePath = "/",
  lang,
}: ArdoRootLayoutProps) {
  // Use optional context (RootLayout renders before ArdoProvider is available)
  const context = use(ArdoContext)
  const resolvedLang = lang ?? context?.config.lang ?? "en"
  const iconBaseUrl = iconBasePath === false ? undefined : normalizeIconBasePath(iconBasePath)

  return (
    <html lang={resolvedLang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {iconBaseUrl == null ? (
          <link rel="icon" type="image/svg+xml" href={favicon ?? ARDO_FAVICON_DATA_URL} />
        ) : (
          <>
            <link rel="icon" href={`${iconBaseUrl}favicon.ico`} sizes="32x32" />
            <link rel="icon" href={favicon ?? `${iconBaseUrl}icon.svg`} type="image/svg+xml" />
            <link rel="apple-touch-icon" href={`${iconBaseUrl}apple-touch-icon.png`} />
          </>
        )}
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

function normalizeIconBasePath(basePath: string): string {
  if (basePath === "") {
    return "/"
  }

  return `${basePath.endsWith("/") ? basePath.slice(0, -1) : basePath}/`
}

// =============================================================================
// Layout Component
// =============================================================================

export type ArdoLayoutProps = {
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
          {footer}
        </main>
      </div>
    </div>
  )
}
