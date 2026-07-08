import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from "react"
import { Outlet, useLocation, useMatches } from "react-router"

import type { ArdoConfig } from "../config/types"

import { createBrandThemeCss } from "../config/brand"
import { ArdoProvider, type ArdoSiteConfig, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoFooter } from "./Footer"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { type ArdoLabelsInput, resolveArdoLabels } from "./labels"
import { ArdoLayout } from "./Layout"
import * as layoutStyles from "./Layout.css"
import { isArdoSidebarElement, resolveArdoSidebarItems } from "./Sidebar"

// =============================================================================
// ArdoRoot Component
// =============================================================================

export type ArdoRootProps = {
  /** Ardo config (from virtual:ardo/config) */
  config: ArdoConfig
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
  /** Site chrome children: ArdoHeader, ArdoSidebar, ArdoFooter, and optional content overrides. */
  children?: ReactNode
}

/**
 * All-in-one root component that combines ArdoProvider, Layout, Header,
 * Sidebar, Footer, and homepage detection into a single component.
 *
 * @example Minimal usage
 * ```tsx
 * import config from "virtual:ardo/config"
 *
 * export default function Root() {
 *   return <ArdoRoot config={config} />
 * }
 * ```
 *
 * @example With JSX chrome
 * ```tsx
 * export default function Root() {
 *   return (
 *     <ArdoRoot config={config}>
 *       <ArdoHeader>
 *         <ArdoNav>
 *           <ArdoNavLink to="/guide">Guide</ArdoNavLink>
 *         </ArdoNav>
 *       </ArdoHeader>
 *       <ArdoSidebar>
 *         <ArdoSidebarSection id="guide" label="Guide" to="/guide">
 *           <ArdoGeneratedSidebar section="guide" />
 *         </ArdoSidebarSection>
 *       </ArdoSidebar>
 *       <ArdoFooter message="Released under the MIT License." />
 *     </ArdoRoot>
 *   )
 * }
 * ```
 */
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

function ArdoBrandThemeStyle({ brand }: { brand: ArdoConfig["brand"] }) {
  const css = createBrandThemeCss(brand)
  if (css === undefined) return null
  return <style data-ardo-brand dangerouslySetInnerHTML={{ __html: css }} />
}

type RootChrome = {
  content: ReactNode
  footer: ReactNode
  header: ReactNode
  sidebar: ReactNode
}

function splitRootChildren(children: ReactNode): RootChrome {
  const content: ReactNode[] = []
  let footer: ReactNode
  let header: ReactNode
  let sidebar: ReactNode

  for (const child of flattenRootChildren(children)) {
    if (isArdoHeaderElement(child)) {
      header = child
    } else if (isArdoSidebarElement(child)) {
      sidebar = child
    } else if (isArdoFooterElement(child)) {
      footer = child
    } else {
      content.push(child)
    }
  }

  return {
    content: content.length === 0 ? undefined : content.length === 1 ? content[0] : <>{content}</>,
    footer,
    header,
    sidebar,
  }
}

function flattenRootChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      result.push(...flattenRootChildren(child.props.children))
    } else {
      result.push(child)
    }
  }
  return result
}

function isArdoHeaderElement(child: ReactNode): child is ReactElement<ArdoHeaderProps> {
  return isValidElement<ArdoHeaderProps>(child) && child.type === ArdoHeader
}

function isArdoFooterElement(child: ReactNode): boolean {
  return isValidElement(child) && child.type === ArdoFooter
}

function resolveRootHeader(
  config: ArdoConfig,
  header: ReactNode,
  mobileMenuContent: ReactNode
): ReactNode {
  if (header !== undefined) {
    return enhanceHeader(header, config, mobileMenuContent)
  }
  return <ArdoHeader logo={config.brand?.logo} mobileMenuContent={mobileMenuContent} />
}

export function ArdoRoot({
  config,
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
  const chrome = useMemo(() => splitRootChildren(children), [children])
  const showChrome = routeChrome !== false
  // Bare layout: no sidebar, no rail — used for the home page and any other
  // marketing-style routes (TSX or MDX). Falls back to the legacy hardcoded
  // home detection if a route hasn't opted in via `handle.layout`.
  const isBareLayout = layout === "bare" || location.pathname === "/" || location.pathname === ""
  const sidebarItems = useMemo(
    () => resolveArdoSidebarItems(chrome.sidebar, location.pathname),
    [chrome.sidebar, location.pathname]
  )
  // Search lives in the header now. The sidebar no longer carries it.
  const resolvedSidebar = isBareLayout ? undefined : chrome.sidebar
  const resolvedHeader = showChrome
    ? resolveRootHeader(config, chrome.header, isBareLayout ? undefined : resolvedSidebar)
    : null
  const resolvedFooter = showChrome ? (
    chrome.footer === undefined ? (
      <ArdoFooter />
    ) : (
      chrome.footer
    )
  ) : null

  const siteConfig = useMemo<ArdoSiteConfig>(
    () => ({ editLink, labels: resolveArdoLabels(labels), lastUpdated, tocLabel }),
    [editLink, labels, lastUpdated, tocLabel]
  )

  const content = (
    <>
      <ArdoBrandThemeStyle brand={config.brand} />
      <ArdoProvider config={config} sidebar={sidebarItems}>
        <ArdoLayout
          className={resolveLayoutClassName(className, isBareLayout)}
          header={resolvedHeader}
          sidebar={resolvedSidebar}
          footer={resolvedFooter}
        >
          {chrome.content ?? <Outlet />}
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

function enhanceHeader(
  header: ReactNode,
  config: ArdoConfig,
  mobileMenuContent: ReactNode
): ReactNode {
  if (!isValidElement<ArdoHeaderProps>(header) || header.type !== ArdoHeader) {
    return header
  }

  const existingMobileMenuContent = header.props.mobileMenuContent
  if (existingMobileMenuContent !== undefined) {
    return header
  }

  return cloneElement(header, {
    logo: header.props.logo ?? config.brand?.logo,
    mobileMenuContent,
  })
}
