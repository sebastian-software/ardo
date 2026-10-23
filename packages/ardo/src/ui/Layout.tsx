import { type ReactNode, use } from "react"
import { ArdoHead, ArdoScripts } from "../runtime/document"
import { ArdoDocumentContext } from "../runtime/document-context"
import { ArdoContext, useArdoLabels } from "../runtime/hooks"
import { ARDO_FAVICON_DATA_URL } from "./favicon"
import { ArdoLayoutVariantContext } from "./layout-context"
import * as styles from "./Layout.css"
import { type ArdoThemePreference, getArdoThemeBootstrapScript } from "./theme-mode"

// =============================================================================
// RootLayout Component (html/head/body shell)
// =============================================================================

export type ArdoRootLayoutProps = {
  children: ReactNode
  /** HTML class for inherited site tokens, including UI portaled outside the app root. */
  className?: string
  /**
   * Favicon URL, usually an imported asset. Defaults to the `icon` passed to
   * `ArdoRoot`, then to the generated owl icons. Its response supplies the MIME type.
   */
  icon?: string
  /** 180×180 PNG for iOS home screens. Defaults to `ArdoRoot`'s, then to the generated one. */
  appleTouchIcon?: string
  /**
   * Base URL for generated icon files.
   * Set to `false` to render only the inline fallback favicon link.
   */
  iconBasePath?: false | string
  /** Language attribute for `<html>` (default: from config or "en") */
  lang?: string
  /**
   * Theme policy applied before first paint.
   *
   * - `"auto"` keeps the user-selectable mode: stored `ardo-theme` first,
   *   then system preference. This is the default.
   * - `"light"` / `"dark"` force one mode and clear stale stored preferences.
   * - `"system"` always follows `prefers-color-scheme` and clears stale stored
   *   preferences.
   */
  colorScheme?: ArdoThemePreference
}

export type ArdoScrollMode = "document" | "viewport"

/**
 * Default HTML shell for Ardo sites. Ardo renders it on the server only; the
 * page inside it hydrates. Export a `Layout` from root.tsx to customize it.
 *
 * @example With a favicon
 * ```tsx
 * // app/root.tsx
 * import type { ReactNode } from "ardo/react"
 * import { ArdoRootLayout } from "ardo/ui"
 * import icon from "./assets/icon.svg"
 *
 * export function Layout({ children }: { children: ReactNode }) {
 *   return <ArdoRootLayout icon={icon}>{children}</ArdoRootLayout>
 * }
 * ```
 */
export function ArdoRootLayout({
  children,
  className,
  icon: iconProp,
  appleTouchIcon: appleTouchIconProp,
  iconBasePath,
  lang,
  colorScheme = "auto",
}: ArdoRootLayoutProps) {
  // Use optional context (RootLayout renders before ArdoProvider is available)
  const context = use(ArdoContext)
  const document = use(ArdoDocumentContext)
  const resolvedLang = lang ?? document?.lang ?? context?.config.lang ?? "en"
  const resolvedIconBase = iconBasePath ?? document?.iconBasePath ?? "/"
  const iconBaseUrl =
    resolvedIconBase === false ? undefined : normalizeIconBasePath(resolvedIconBase)
  const icon = iconProp ?? document?.icon
  const appleTouchIcon =
    appleTouchIconProp ??
    document?.appleTouchIcon ??
    (iconBaseUrl == null ? undefined : `${iconBaseUrl}apple-touch-icon.png`)

  return (
    <html lang={resolvedLang} className={className} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: getArdoThemeBootstrapScript(colorScheme) }} />
        {icon !== undefined ? (
          // A site icon replaces the owl; the generated favicon.ico stays for old clients.
          <link rel="icon" href={icon} />
        ) : iconBaseUrl == null ? (
          <link rel="icon" type="image/svg+xml" href={ARDO_FAVICON_DATA_URL} />
        ) : (
          <>
            <link rel="icon" href={`${iconBaseUrl}favicon.ico`} sizes="32x32" />
            <link rel="icon" href={`${iconBaseUrl}icon.svg`} type="image/svg+xml" />
          </>
        )}
        {appleTouchIcon !== undefined && <link rel="apple-touch-icon" href={appleTouchIcon} />}
        <ArdoHead />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ArdoScripts />
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
  /** Render a plain main element with document scrolling for bare routes. */
  bare?: boolean
  /** Use the document as the scroll container instead of the viewport shell. */
  scrollMode?: ArdoScrollMode
  /** Render the built-in skip link. Disable when the host owns navigation chrome. */
  showSkipLink?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Layout component with explicit slot props.
 *
 * @example
 * ```tsx
 * <ArdoLayout
 *   header={<ArdoHeader logo="/logo.svg" title="Ardo" />}
 *   sidebar={<ArdoSidebar />}
 *   footer={<ArdoFooter message="MIT License" />}
 * >
 *   <ArdoOutlet />
 * </ArdoLayout>
 * ```
 */
export function ArdoLayout({
  header,
  sidebar,
  footer,
  children,
  className,
  bare = false,
  scrollMode = "viewport",
  showSkipLink = true,
}: ArdoLayoutProps) {
  const labels = useArdoLabels()
  const hasHeader = header != null && header !== false
  const isDocumentScroll = scrollMode === "document"
  const containerClass = bare
    ? hasHeader
      ? styles.withHeader
      : undefined
    : [
        styles.layoutContainer,
        hasHeader && styles.withHeader,
        isDocumentScroll && styles.documentScrollContainer,
      ]
        .filter(Boolean)
        .join(" ")
  const layoutClass = [
    className ?? `${styles.layout}${bare ? ` ${styles.home}` : ""}`,
    isDocumentScroll && styles.documentScroll,
  ]
    .filter(Boolean)
    .join(" ")
  return (
    <ArdoLayoutVariantContext value={bare ? "bare" : "doc"}>
      <div className={layoutClass}>
        {showSkipLink && (
          <a href="#main-content" className={styles.skipLink}>
            {labels.layout.skipToContent}
          </a>
        )}
        {header}
        <div className={containerClass}>
          {sidebar}
          <main
            id="main-content"
            className={
              bare
                ? undefined
                : [styles.main, isDocumentScroll && styles.documentScrollMain]
                    .filter(Boolean)
                    .join(" ")
            }
          >
            {children}
            {footer}
          </main>
        </div>
      </div>
    </ArdoLayoutVariantContext>
  )
}
