import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useMemo,
} from "react"
import type { ArdoConfig } from "../config/types"

import { ArdoMDXComponentsContext, type ArdoMDXComponents } from "../mdx/components-context"
import {
  ArdoConfigContext,
  ArdoProvider,
  type ArdoSiteConfig,
  ArdoSiteConfigProvider,
} from "../runtime/hooks"
import { ArdoDocumentIconsContext } from "../runtime/document-context"
import { ArdoOutlet } from "../runtime/page"
import { useArdoPage, useArdoPath } from "../runtime/page-context"
import { ArdoFooter } from "./Footer"
import { createGeneratedSidebarSections } from "./generated-sections"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import type { ArdoLogo } from "./HeaderLogo"
import { type ArdoLabelsInput, resolveArdoLabels } from "./labels"
import { ArdoLayout, type ArdoScrollMode } from "./Layout"
import * as layoutStyles from "./Layout.css"
import { ArdoSidebar, isArdoSidebarElement, resolveArdoSidebarItems } from "./Sidebar"
import { ArdoTheme } from "./Theme"
import type { ArdoThemeProps } from "./theme/theme-css"

// =============================================================================
// ArdoRoot Component
// =============================================================================

export type ArdoRootProps = {
  /**
   * The site config. Ardo's entries provide it from `ardo.config.ts`, so a
   * root component can leave it out; pass it in tests and previews.
   */
  config?: ArdoConfig
  /** Add to or override the default Markdown component set, including its wrapper. */
  components?: ArdoMDXComponents
  /** Hues, saturation, callout hues, fonts, and design tokens; see {@link ArdoTheme}. */
  theme?: ArdoThemeProps
  /**
   * Header and mobile menu logo. Import the file, `import logo from "./assets/logo.svg"`,
   * so Vite fingerprints it; `{ light, dark }` switches with the color scheme.
   */
  logo?: ArdoLogo
  /**
   * Favicon, usually an imported SVG or PNG. Without it, Ardo links its
   * generated owl icons.
   */
  icon?: string
  /** 180×180 PNG for iOS home screens. Defaults to the generated owl icon. */
  appleTouchIcon?: string
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
  /**
   * Sidebar in place of an `ArdoSidebar` child, or `false` for no sidebar.
   * Without either, Ardo renders one section per top-level route folder.
   */
  sidebar?: false | ReactNode
  /** Site chrome children: ArdoHeader, ArdoSidebar, ArdoFooter, and optional content overrides. */
  children?: ReactNode
}

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

/**
 * Bare layout: no sidebar, no section tabs — used for the home page and any
 * other marketing-style routes (TSX or MDX). Falls back to the legacy
 * hardcoded home detection if a route hasn't opted in via `handle.layout`.
 * A missing page keeps the header and footer but has no section to show in
 * the sidebar.
 */
function useBareLayout(pathname: string): boolean {
  const layout = useRouteLayout()
  const isErrorPage = useArdoPage().error != null
  return layout === "bare" || pathname === "/" || pathname === "" || isErrorPage
}

function useRouteChrome(): boolean | undefined {
  return readChromeHandle(useArdoPage().handle)
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
function resolveHeaderSlot(header: false | ReactNode, mobileMenuContent: ReactNode): ReactNode {
  return header === false ? null : resolveRootHeader(header, mobileMenuContent)
}

/** A `footer` prop wins over an `ArdoFooter` child; without either, Ardo renders its default. */
function resolveFooterSlot(footer: false | ReactNode): ReactNode {
  if (footer === false) return null
  return footer ?? <ArdoFooter />
}

/** A `sidebar` prop wins over an `ArdoSidebar` child; without either, Ardo generates one. */
function resolveSidebarSlot(sidebar: false | ReactNode): ReactNode {
  if (sidebar === false) return undefined
  return sidebar ?? <ArdoSidebar />
}

function resolveRootConfig(config: ArdoConfig | null | undefined): ArdoConfig {
  if (config != null) return config
  throw new Error(
    "[ardo] ArdoRoot has no site config. Render it inside Ardo's app, or pass the config prop."
  )
}

function resolveRootHeader(header: ReactNode, mobileMenuContent: ReactNode): ReactNode {
  if (header !== undefined) {
    return enhanceHeader(header, mobileMenuContent)
  }
  return <ArdoHeader mobileMenuContent={mobileMenuContent} />
}

/**
 * The whole site around the page: header with search, a sidebar with one
 * section per route folder, the page, and the footer. Render it in
 * `app/root.tsx`; pass `ArdoHeader`, `ArdoSidebar`, or `ArdoFooter` as
 * children to change a part.
 *
 * @example Minimal usage: header with search, a generated sidebar, and the footer
 * ```tsx
 * export default function Root() {
 *   return <ArdoRoot />
 * }
 * ```
 *
 * @example With JSX chrome
 * ```tsx
 * export default function Root() {
 *   return (
 *     <ArdoRoot>
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
export function ArdoRoot({
  config: configProp,
  components,
  theme,
  logo,
  icon,
  appleTouchIcon,
  editLink,
  lastUpdated,
  labels,
  tocLabel,
  className,
  scrollMode = "viewport",
  header,
  footer,
  sidebar: sidebarProp,
  children,
}: ArdoRootProps) {
  const config = resolveRootConfig(configProp ?? use(ArdoConfigContext))
  // Server only: the HTML shell renders after the page and links these icons.
  use(ArdoDocumentIconsContext)?.({ icon, appleTouchIcon })
  const pathname = useArdoPath()
  const routeChrome = useRouteChrome()
  const chrome = useMemo(() => splitRootChildren(children), [children])
  const showChrome = routeChrome !== false
  const isBareLayout = useBareLayout(pathname)
  const sidebar = useMemo(
    (): ReactNode =>
      withGeneratedSections(resolveSidebarSlot(sidebarProp ?? chrome.sidebar), config, pathname),
    [sidebarProp, chrome.sidebar, config, pathname]
  )
  const sidebarItems = useMemo(
    () => resolveArdoSidebarItems(sidebar, pathname),
    [sidebar, pathname]
  )
  // Search lives in the header now. The sidebar no longer carries it.
  const resolvedSidebar = isBareLayout ? undefined : sidebar
  const resolvedHeader = showChrome
    ? resolveHeaderSlot(header ?? chrome.header, resolvedSidebar)
    : null
  const resolvedFooter = showChrome ? resolveFooterSlot(footer ?? chrome.footer) : null

  const siteConfig = useRootSiteConfig({ editLink, labels, lastUpdated, logo, tocLabel })

  const content = (
    <>
      {theme != null && <ArdoTheme {...theme} />}
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
          <ArdoMDXComponentsContext value={components ?? {}}>
            {chrome.content ?? <ArdoOutlet />}
          </ArdoMDXComponentsContext>
        </ArdoLayout>
      </ArdoProvider>
    </>
  )

  return siteConfig === undefined ? (
    content
  ) : (
    <ArdoSiteConfigProvider value={siteConfig}>{content}</ArdoSiteConfigProvider>
  )
}

type RootSiteConfigInput = Pick<
  ArdoRootProps,
  "editLink" | "labels" | "lastUpdated" | "logo" | "tocLabel"
>

/** The site config `ArdoRoot` provides, or `undefined` when none of its props set one. */
function useRootSiteConfig({
  editLink,
  labels,
  lastUpdated,
  logo,
  tocLabel,
}: RootSiteConfigInput): ArdoSiteConfig | undefined {
  const siteConfig = useMemo<ArdoSiteConfig>(
    () => ({ editLink, labels: resolveArdoLabels(labels), lastUpdated, logo, tocLabel }),
    [editLink, labels, lastUpdated, logo, tocLabel]
  )
  const hasSiteConfig =
    editLink !== undefined ||
    labels !== undefined ||
    lastUpdated !== undefined ||
    logo !== undefined ||
    (tocLabel ?? "") !== ""
  return hasSiteConfig ? siteConfig : undefined
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

function enhanceHeader(header: ReactNode, mobileMenuContent: ReactNode): ReactNode {
  if (!isValidElement<ArdoHeaderProps>(header) || header.type !== ArdoHeader) {
    return header
  }

  const existingMobileMenuContent = header.props.mobileMenuContent
  if (existingMobileMenuContent !== undefined) {
    return header
  }

  return cloneElement(header, { mobileMenuContent })
}
