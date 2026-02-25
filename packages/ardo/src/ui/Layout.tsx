import { type ReactNode, useContext } from "react"
import { Links, Meta, Scripts, ScrollRestoration } from "react-router"
import { ArdoContext } from "../runtime/hooks"

// =============================================================================
// RootLayout Component (html/head/body shell)
// =============================================================================

const ARDO_FAVICON =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill-rule=%22evenodd%22%20stroke-linejoin=%22round%22%20stroke-miterlimit=%222%22%20clip-rule=%22evenodd%22%20viewBox=%220%200%20600%20600%22%3E%3Cg%20fill=%22%2300655a%22%3E%3Cpath%20d=%22M581%20315h-16c-1%200%200-30-7-61a287%20287%200%200%200-70-133q-30-33-71-54a254%20254%200%200%200-304%2053c-23%2024-36%2044-51%2074-29%2059-26%20120-27%20121H19c-2-1-5-115%2082-206a274%20274%200%200%201%20452%2078%20304%20304%200%200%201%2028%20128%22/%3E%3Cpath%20d=%22M148%20121c1-1%2020%2019%2022%2021l21%2020%2041%2040c3%201%2025-15%2068-15%2044%200%2065%2016%2068%2015l42-41%2021-20c2-2%2020-21%2021-20v184l22%2051%2012%2026c1%203%2011%2025%2010%2026s-87-1-88%201c-1%201%2016%2015%2028%2034%2019%2029%2021%2048%2023%2049s24-29%2026-31c7-10%2016-25%2021-36%2029-59%2024-108%2026-109h15a257%20257%200%200%201-71%20182q-70%2077-175%2080c-65%201-134-31-176-79a283%20283%200%200%201-66-125c-1-5-10-55-6-58h15l2%2028%205%2028c7%2026%209%2030%2019%2053a261%20261%200%200%200%2048%2067c1%200%208-27%2022-49%2012-19%2029-33%2029-34-1-2-88%201-89-1-1-1%209-22%2010-25l12-28%2022-49zm233%2087%2018%2013%2016%2016%2013%2018%2011%2021c2%200%201-29%201-31v-95l-16%2014-14%2014c-2%203-30%2029-29%2030m-161%200c-1%202-18%2011-35%2029l-13%2018-6%2010c-1%202-4%2012-5%2011-2%200%200-28%200-31v-63l-1-32c1-1%2029%2027%2030%2029zm137%203c1%201-14%2015-16%2017l-16%2018c-9%2011-22%2037-25%2038-2%201-16-26-26-38-11-15-32-33-31-35a129%20129%200%200%201%2057-12l29%203c4%201%2027%207%2028%209m-127%207c1%200%2034%2033%2033%2034s-20-9-42-6c-27%204-34%2014-35%2012a121%20121%200%200%201%2044-40m140%200c7-1%2044%2035%2043%2039-1%202-10-9-34-11-25-3-40%206-41%205s31-33%2032-33m-97%20159s-3-12-8-23l-10-17q2-3-1-15a25%2025%200%200%200-25-16l-4%201c-2-1-36-34-35-35%201-3%2017-10%2021-12q15-3%2030-2%2026%205%2043%2026c11%2012%2016%2034%2013%2052-4%2027-22%2042-24%2041m138-104-35%2034-5-1-13%202-5%204q-7%207-9%2017l1%208-10%2016-8%2024c-4%202-47-45-10-94%209-12%2026-22%2042-25%2032-4%2053%2013%2052%2015m-231%208%2033%2032-1%203q-7%2011-4%2021%203%209%2011%2014a24%2024%200%200%200%2020%203l9-5c4%200%2015%2034%2015%2036-1%203-27%2014-51%207-17-5-24-12-35-24a68%2068%200%200%201-15-45c1-23%2016-43%2018-42m240%200c4-1%2036%2045%204%2087-32%2040-81%2024-86%2018-2-2%2011-37%2014-37q1-1%203%202l9%204h5q7-1%2013-4%209-6%2011-16%201-10-5-19l-1-2%2017-17zm31%2052%2014%2032c0%202%2014%2031%2012%2031h-65q-1-1%207-6l6-5%2011-13c14-23%2014-39%2015-39m-301%201c1%200-1%2016%2014%2038%2011%2015%2025%2023%2024%2024h-32l-33-1c-1-1%2011-26%2013-31%201-2%2012-31%2014-30m150%2032%2010%2014%2012%2011-5%2019-4%2020h-25c-2%200-4-15-5-19-2-7-6-19-5-20l12-12zm-33%2032%206%2027c1%202%207%2026%206%2027s-23-20-25-22c-1-1-24-22-23-23l19-3c12-4%2015-7%2017-6m67%200%2017%206%2019%203-24%2023c-3%203-23%2022-25%2021-1%200%2011-52%2013-53m-120%2011%2021%2019%2021%2020c5%204%2043%2041%2045%2040l10-10%2011-10%2021-19c5-5%2042-40%2044-40%207%202%2031%2030%2036%2037l13%2023c4%208%2012%2030%2012%2033a209%20209%200%200%201-58%2039c-19%208-21%209-43%2014-25%206-42%205-48%206a223%20223%200%200%201-119-37c-7-5-26-19-27-22s8-26%2011-32l13-24%2017-20c2-3%2017-16%2020-17%22/%3E%3C/g%3E%3C/svg%3E"

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
