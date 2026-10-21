import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from "react"
import type { ArdoConfig } from "../config/types"

import { createBrandThemeCss } from "../config/brand"
import { ArdoProvider, type ArdoSiteConfig, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoOutlet } from "../runtime/page"
import { useArdoPage, useArdoPath } from "../runtime/page-context"
import { ArdoFooter } from "./Footer"
import { createGeneratedSidebarSections } from "./generated-sections"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { type ArdoLabelsInput, resolveArdoLabels } from "./labels"
import { ArdoLayout, type ArdoScrollMode } from "./Layout"
import * as layoutStyles from "./Layout.css"
import { ArdoSidebar, isArdoSidebarElement, resolveArdoSidebarItems } from "./Sidebar"

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
  /** Choose the viewport shell (default) or let the document scroll. */
  scrollMode?: ArdoScrollMode
  /**
   * Site header in place of an `ArdoHeader` child: your own component, or
   * `false` for no header. Children can only name Ardo's own header.
   */
  header?: false | ReactNode
  /**
   * Site footer in place of an `ArdoFooter` child: your own component, or
   * `false` for no footer. Without either, Ardo renders its default footer.
   */
  footer?: false | ReactNode
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
 * Reads the `layout` value of the page's `handle` export. MDX routes get this
 * export generated from `frontmatter.layout`; .tsx routes set it directly with
 * `export const handle = { layout: "bare" }`.
 */
function useRouteLayout(): string | undefined {
  return readLayoutHandle(useArdoPage().handle)
}

function useRouteChrome(): boolean | undefined {
  return readChromeHandle(useArdoPage().handle)
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

/** A `header` prop wins over an `ArdoHeader` child; `false` leaves the header out. */
function resolveHeaderSlot(
  config: ArdoConfig,
  header: false | ReactNode,
  mobileMenuContent: ReactNode
): ReactNode {
  return header === false ? null : resolveRootHeader(config, header, mobileMenuContent)
}

/** A `footer` prop wins over an `ArdoFooter` child; without either, Ardo renders its default. */
function resolveFooterSlot(footer: false | ReactNode): ReactNode {
  if (footer === false) return null
  return footer ?? <ArdoFooter />
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
  scrollMode = "viewport",
  header,
  footer,
  children,
}: ArdoRootProps) {
  const pathname = useArdoPath()
  const isErrorPage = useArdoPage().error != null
  const layout = useRouteLayout()
  const routeChrome = useRouteChrome()
  const chrome = useMemo(() => splitRootChildren(children), [children])
  const showChrome = routeChrome !== false
  // Bare layout: no sidebar, no section tabs — used for the home page and any
  // other marketing-style routes (TSX or MDX). Falls back to the legacy
  // hardcoded home detection if a route hasn't opted in via `handle.layout`.
  // A missing page keeps the header and footer but has no section to show in the sidebar.
  const isBareLayout = layout === "bare" || pathname === "/" || pathname === "" || isErrorPage
  const sidebar = useMemo(
    (): ReactNode => withGeneratedSections(chrome.sidebar, config, pathname),
    [chrome.sidebar, config, pathname]
  )
  const sidebarItems = useMemo(
    () => resolveArdoSidebarItems(sidebar, pathname),
    [sidebar, pathname]
  )
  // Search lives in the header now. The sidebar no longer carries it.
  const resolvedSidebar = isBareLayout ? undefined : sidebar
  const resolvedHeader = showChrome
    ? resolveHeaderSlot(config, header ?? chrome.header, resolvedSidebar)
    : null
  const resolvedFooter = showChrome ? resolveFooterSlot(footer ?? chrome.footer) : null

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
          scrollMode={scrollMode}
          bare={isBareLayout}
          showSkipLink={showChrome}
          header={resolvedHeader}
          sidebar={resolvedSidebar}
          footer={resolvedFooter}
        >
          {chrome.content ?? <ArdoOutlet />}
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
 * `<ArdoSidebar />` without children gets one section per top-level route
 * folder. A sidebar with explicit children is left exactly as written.
 */
function withGeneratedSections(
  sidebar: ReactNode,
  config: ArdoConfig,
  pathname: string
): ReactNode {
  if (!isArdoSidebarElement(sidebar) || sidebar.props.children != null) {
    return sidebar
  }

  return (
    <ArdoSidebar {...sidebar.props}>{createGeneratedSidebarSections(config, pathname)}</ArdoSidebar>
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
