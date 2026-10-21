/* eslint-disable max-lines */
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import type { SidebarItem as SidebarItemType } from "../config/types"
import type { ArdoGeneratedSidebarProps } from "./GeneratedSidebar"

import { useArdoLabels } from "../runtime/hooks"
import { ArdoActiveLink } from "../runtime/page"
import { useArdoPath } from "../runtime/page-context"
import { ChromeIcon } from "./chrome-icons"
import { joinClassNames } from "./classnames"
import { resolveSectionIcon } from "./section-catalog"
import * as styles from "./Sidebar.css"
import { getSidebarScrollTop } from "./sidebar-scroll"
import { type SidebarTabItem, SidebarTabs } from "./SidebarTabs"

/** Internal page path such as `/guide`. */
type RoutePath = string

// =============================================================================
// Sidebar Context
// =============================================================================

type SidebarContextValue = {
  currentPath: string
}

const SidebarContext = createContext<SidebarContextValue>({ currentPath: "" })

function useSidebarContext() {
  return use(SidebarContext)
}

// =============================================================================
// Sidebar Component Types
// =============================================================================

export type ArdoSidebarProps = {
  /**
   * Sidebar sections. Each section contributes one tab and one panel. Inside
   * `ArdoRoot`, leave this empty to get one section per top-level route folder.
   */
  children?: ReactNode
  /** Content rendered above navigation (e.g. search) */
  header?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export type ArdoSidebarSectionProps = {
  /** Stable section id, usually matching a top-level route segment. */
  id: string
  /** Visible tab label. */
  label: string
  /** Landing route for the section tab. */
  to: RoutePath
  /**
   * Tab icon. Defaults to the catalog icon for known section ids such as
   * `guide`, `api` or `adr`; other ids get a text-only tab. Pass `null` to
   * drop the icon.
   */
  icon?: ReactNode
  /** Optional active-route override. Defaults to matching the first segment of `to`. */
  match?: ((pathname: string) => boolean) | RegExp | string
  /** Sidebar content for this section. */
  children?: ReactNode
}

/**
 * Marker component for declaring one section tab and panel inside `ArdoSidebar`.
 *
 * `ArdoSidebar` reads this element's props before React renders it. When used
 * outside `ArdoSidebar`, it only renders its children.
 */
export function ArdoSidebarSection({
  children,
  icon,
  id,
  label,
  match,
  to,
}: ArdoSidebarSectionProps) {
  void icon
  void id
  void label
  void match
  void to
  return <>{children}</>
}

// =============================================================================
// Sidebar Main Component
// =============================================================================

/**
 * Sidebar component supporting JSX-first section composition.
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <SidebarSection id="guide" label="Guide" to="/guide">
 *     <SidebarGroup title="Guide">
 *       <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
 *     </SidebarGroup>
 *   </SidebarSection>
 * </Sidebar>
 * ```
 */
export function ArdoSidebar({ children, header, className }: ArdoSidebarProps) {
  const pathname = useArdoPath()
  const labels = useArdoLabels()
  const sections = getSidebarSectionElements(children)
  const activeSection =
    sections.length === 0
      ? undefined
      : (findMatchingSidebarSection(sections, pathname) ?? sections[0])
  const tabItems = sections.map((section) => sectionToTabItem(section, section === activeSection))
  const contextValue = useMemo(() => ({ currentPath: pathname }), [pathname])
  const navRef = useRef<HTMLElement>(null)

  // Deep pages sit far down long trees, so bring the current link into view.
  // Only the nav scrolls; scrollIntoView would move the page as well.
  useEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector('a[aria-current="page"]')
    if (nav == null || link == null) return
    const scrollTop = getSidebarScrollTop(
      nav.getBoundingClientRect(),
      link.getBoundingClientRect(),
      nav.scrollTop
    )
    if (scrollTop !== undefined) nav.scrollTop = scrollTop
  }, [pathname])

  return (
    <SidebarContext value={contextValue}>
      <aside className={joinClassNames("ardo-sidebar", className ?? styles.sidebar)}>
        {/* A single section needs no switcher; its tree gets the full width. */}
        {tabItems.length > 1 && <SidebarTabs items={tabItems} />}
        <div className={`ardo-sidebar-panel ${styles.sidebarPanel}`}>
          {header != null && (
            <div className={`ardo-sidebar-header ${styles.sidebarHeader}`}>{header}</div>
          )}
          <nav
            ref={navRef}
            aria-label={labels.sidebar.mainNavigation}
            className={`ardo-sidebar-nav ${styles.sidebarNav}`}
          >
            {activeSection != null ? (
              <ul className={`${styles.sidebarList} ${styles.sidebarList0}`}>
                {activeSection.props.children}
              </ul>
            ) : children != null && sections.length === 0 ? (
              <ul className={`${styles.sidebarList} ${styles.sidebarList0}`}>{children}</ul>
            ) : null}
          </nav>
        </div>
      </aside>
    </SidebarContext>
  )
}

// =============================================================================
// SidebarGroup Component
// =============================================================================

export type ArdoSidebarGroupProps = {
  /** Group title */
  title: string
  /** Optional link for the group title */
  to?: string
  /** Initial collapsed state (default: false) */
  collapsed?: boolean
  /** Whether group is collapsible (default: true if has children) */
  collapsible?: boolean
  /** Children (SidebarLink, nested SidebarGroup) */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Group component for organizing sidebar links.
 *
 * @example
 * ```tsx
 * <SidebarGroup title="Guide">
 *   <SidebarLink to="/guide/intro">Introduction</SidebarLink>
 *   <SidebarLink to="/guide/setup">Setup</SidebarLink>
 * </SidebarGroup>
 * ```
 *
 * @example With collapsible state
 * ```tsx
 * <SidebarGroup title="Advanced" collapsed>
 *   <SidebarLink to="/advanced/config">Configuration</SidebarLink>
 * </SidebarGroup>
 * ```
 */
export function ArdoSidebarGroup({
  title,
  to,
  collapsed: initialCollapsed = false,
  collapsible = true,
  children,
  className,
}: ArdoSidebarGroupProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const labels = useArdoLabels()
  const { currentPath } = useSidebarContext()
  const contentId = useId()

  // Check if any child is active
  const hasActiveChild = checkChildrenActive(children, currentPath)

  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textButtonClassName = [textClassName, styles.sidebarTextButton].join(" ")

  const hasChildren = Children.count(children) > 0
  const hasTo = (to ?? "") !== ""
  const canToggle = collapsible && hasChildren
  const toggleLabel = `${collapsed ? "Expand" : "Collapse"} ${title}`

  const itemClassName =
    className ??
    [styles.sidebarItem, hasChildren && styles.sidebarItemGroup].filter(Boolean).join(" ")

  return (
    <li className={itemClassName}>
      <div className={styles.sidebarItemHeader}>
        {hasTo ? (
          <ArdoActiveLink
            to={to ?? "/"}
            end
            className={({ isActive }) =>
              [textClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {title}
          </ArdoActiveLink>
        ) : canToggle ? (
          <button
            type="button"
            className={textButtonClassName}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleLabel}
          >
            <span>{title}</span>
            <CollapseChevron collapsed={collapsed} />
          </button>
        ) : (
          <span className={textClassName}>{title}</span>
        )}

        {canToggle && hasTo && (
          <button
            type="button"
            className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-label={`${collapsed ? labels.sidebar.expand : labels.sidebar.collapse} ${title}`}
            aria-expanded={!collapsed}
            aria-controls={contentId}
          >
            <ChromeIcon name="chevron" />
          </button>
        )}
      </div>

      {hasChildren && (
        <div
          id={contentId}
          className={styles.sidebarCollapseWrapper}
          data-collapsed={collapsed}
          aria-hidden={collapsed}
          inert={collapsed}
        >
          <div className={styles.sidebarCollapseInner}>
            <ul className={`${styles.sidebarList} ${styles.sidebarList1}`}>{children}</ul>
          </div>
        </div>
      )}
    </li>
  )
}

// =============================================================================
// SidebarLink Component
// =============================================================================

export type ArdoSidebarLinkProps = {
  /** Internal route path (type-safe with React Router's registered routes) */
  to: RoutePath
  /** Link text */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Sidebar navigation link.
 *
 * @example
 * ```tsx
 * <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
 * ```
 */
export function ArdoSidebarLink({ to, children, className }: ArdoSidebarLinkProps) {
  const baseClassName = className ?? styles.sidebarLink
  return (
    <li className={styles.sidebarItem}>
      <ArdoActiveLink
        to={to}
        className={({ isActive }) =>
          [baseClassName, isActive && "active"].filter(Boolean).join(" ")
        }
      >
        {children}
      </ArdoActiveLink>
    </li>
  )
}

// =============================================================================
// Internal: Data-driven sidebar rendering
// =============================================================================

type SidebarItemsProps = {
  items: SidebarItemType[]
  depth: number
}

export function SidebarItems({ items, depth }: SidebarItemsProps) {
  // Top-level groups use typographic headings. Flat lists stay plain.
  const treeMode = depth === 0 && items.some((item) => (item.items?.length ?? 0) > 0)
  const depthClass = depth === 0 ? styles.sidebarList0 : styles.sidebarList1
  const listClassName = [styles.sidebarList, depthClass].join(" ")
  return (
    <ul className={listClassName}>
      <SidebarItemListItems items={items} depth={depth} treeMode={treeMode} />
    </ul>
  )
}

function SidebarItemListItems({
  items,
  depth,
  treeMode = false,
}: {
  items: SidebarItemType[]
  depth: number
  treeMode?: boolean
}) {
  return (
    <>
      {items.map((item) => (
        <SidebarItemComponent
          key={item.link ?? `${item.text}-${String(depth)}`}
          item={item}
          depth={depth}
          treeMode={treeMode}
        />
      ))}
    </>
  )
}

type SidebarItemComponentProps = {
  item: SidebarItemType
  depth: number
  treeMode?: boolean
}

function SidebarItemComponent({ item, depth, treeMode = false }: SidebarItemComponentProps) {
  return depth === 0 && treeMode ? (
    <SidebarGroupNode item={item} depth={depth} />
  ) : (
    <SidebarLeafItem item={item} depth={depth} />
  )
}

type SidebarItemState = {
  collapsed: boolean
  toggle: () => void
  contentId: string
  childItems: SidebarItemType[]
  hasChildren: boolean
  hasActiveChild: boolean
  hasItemLink: boolean
  isSelfActive: boolean
}

function useSidebarItem(item: SidebarItemType): SidebarItemState {
  const { currentPath } = useSidebarContext()
  const [collapsed, setCollapsed] = useState(item.collapsed ?? false)
  const contentId = useId()
  const childItems = item.items ?? []
  const hasChildren = childItems.length > 0
  const hasActiveChild =
    hasChildren &&
    childItems.some(
      (child) =>
        child.link === currentPath ||
        child.items?.some((grandchild) => grandchild.link === currentPath)
    )
  const hasItemLink = (item.link ?? "") !== ""
  return {
    collapsed,
    toggle() {
      setCollapsed(!collapsed)
    },
    contentId,
    childItems,
    hasChildren,
    hasActiveChild,
    hasItemLink,
    isSelfActive: hasItemLink && item.link === currentPath,
  }
}

type ItemProps = {
  item: SidebarItemType
  depth: number
}

function sidebarItemClass(hasChildren: boolean) {
  return [styles.sidebarItem, hasChildren && styles.sidebarItemGroup].filter(Boolean).join(" ")
}

function toggleAria(collapsed: boolean, text: string) {
  return `${collapsed ? "Expand" : "Collapse"} ${text}`
}

/** Standalone chevron button shown alongside a linked (navigable) group title. */
function CollapseButton({
  item,
  state,
}: {
  item: SidebarItemType
  state: Pick<SidebarItemState, "collapsed" | "contentId" | "toggle">
}) {
  const labels = useArdoLabels()
  const { collapsed, toggle, contentId } = state
  return (
    <button
      type="button"
      className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
      onClick={toggle}
      aria-label={`${collapsed ? labels.sidebar.expand : labels.sidebar.collapse} ${item.text}`}
      aria-expanded={!collapsed}
      aria-controls={contentId}
    >
      <ChromeIcon name="chevron" />
    </button>
  )
}

function SidebarItemChildren({
  state,
  depth,
}: {
  state: Pick<SidebarItemState, "childItems" | "collapsed" | "contentId">
  depth: number
}) {
  return (
    <div
      id={state.contentId}
      className={styles.sidebarCollapseWrapper}
      data-collapsed={state.collapsed}
      aria-hidden={state.collapsed}
      inert={state.collapsed}
    >
      <div className={styles.sidebarCollapseInner}>
        <SidebarItems items={state.childItems} depth={depth + 1} />
      </div>
    </div>
  )
}

/**
 * Top-level entry in tree mode: a typographic group heading that highlights
 * when the section (or one of its children) is active.
 */
function SidebarGroupNode({ item, depth }: ItemProps) {
  const state = useSidebarItem(item)
  const { collapsed, toggle, contentId, hasChildren, hasActiveChild, hasItemLink, isSelfActive } =
    state
  const capsuleState = isSelfActive ? "active" : hasActiveChild ? "child-active" : ""
  const headerClassName = [styles.sidebarNodeHeader, capsuleState].filter(Boolean).join(" ")

  return (
    <li className={sidebarItemClass(hasChildren)}>
      <div className={headerClassName}>
        {hasItemLink ? (
          <ArdoActiveLink to={item.link ?? "/"} end className={styles.sidebarNodeTitle}>
            {item.text}
          </ArdoActiveLink>
        ) : hasChildren ? (
          <button
            type="button"
            className={styles.sidebarNodeTitle}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleAria(collapsed, item.text)}
          >
            {item.text}
          </button>
        ) : (
          <span className={styles.sidebarNodeTitle}>{item.text}</span>
        )}
        {hasChildren &&
          (hasItemLink ? (
            <CollapseButton item={item} state={state} />
          ) : (
            <CollapseChevron collapsed={collapsed} />
          ))}
      </div>
      {hasChildren && <SidebarItemChildren state={state} depth={depth} />}
    </li>
  )
}

/** Plain link/section used for nested entries and flat (non-tree) top-level lists. */
function SidebarLeafItem({ item, depth }: ItemProps) {
  const state = useSidebarItem(item)
  const { collapsed, toggle, contentId, hasChildren, hasActiveChild, hasItemLink } = state
  const linkClassName = [styles.sidebarLink, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={sidebarItemClass(hasChildren)}>
      <div className={styles.sidebarItemHeader}>
        {hasItemLink ? (
          <ArdoActiveLink
            to={item.link ?? "/"}
            end={hasChildren}
            className={({ isActive }) =>
              [linkClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {item.text}
          </ArdoActiveLink>
        ) : hasChildren ? (
          <button
            type="button"
            className={[textClassName, styles.sidebarTextButton].join(" ")}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleAria(collapsed, item.text)}
          >
            <span>{item.text}</span>
            <CollapseChevron collapsed={collapsed} />
          </button>
        ) : (
          <span className={textClassName}>{item.text}</span>
        )}
        {hasChildren && hasItemLink && <CollapseButton item={item} state={state} />}
      </div>
      {hasChildren && <SidebarItemChildren state={state} depth={depth} />}
    </li>
  )
}

function CollapseChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <span
      className={[styles.sidebarToggleChevron, collapsed && "collapsed"].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <ChromeIcon name="chevron" />
    </span>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

export function isArdoSidebarElement(child: ReactNode): child is ReactElement<ArdoSidebarProps> {
  return isValidElement<ArdoSidebarProps>(child) && child.type === ArdoSidebar
}

export function resolveArdoSidebarItems(
  sidebar: ReactNode,
  currentPath: string
): SidebarItemType[] {
  if (!isArdoSidebarElement(sidebar)) return []

  const sections = getSidebarSectionElements(sidebar.props.children)
  if (sections.length === 0) {
    return sidebarItemsFromChildren(sidebar.props.children)
  }

  const [firstSection] = sections
  const activeSection = findMatchingSidebarSection(sections, currentPath) ?? firstSection
  return sidebarItemsFromChildren(activeSection.props.children)
}

function getSidebarSectionElements(
  children: ReactNode
): Array<ReactElement<ArdoSidebarSectionProps>> {
  return flattenSidebarChildren(children).filter((child) => isSidebarSectionElement(child))
}

function isSidebarSectionElement(child: ReactNode): child is ReactElement<ArdoSidebarSectionProps> {
  return isValidElement<ArdoSidebarSectionProps>(child) && child.type === ArdoSidebarSection
}

function findMatchingSidebarSection(
  sections: Array<ReactElement<ArdoSidebarSectionProps>>,
  pathname: string
): ReactElement<ArdoSidebarSectionProps> | undefined {
  return sections.find((section) => sidebarSectionMatchesPath(section, pathname))
}

function sidebarSectionMatchesPath(
  section: ReactElement<ArdoSidebarSectionProps>,
  pathname: string
): boolean {
  const { match, to } = section.props
  if (typeof match === "function") return match(pathname)
  if (match != null) {
    return typeof match === "string" ? pathname.startsWith(match) : match.test(pathname)
  }

  const targetPath = routePathToString(to)
  if (targetPath === undefined) return false

  const firstSegment = targetPath.split("/").find((segment) => segment !== "")
  if (firstSegment === undefined) return pathname === "/" || pathname === ""

  const root = `/${firstSegment}`
  return pathname === root || pathname.startsWith(`${root}/`)
}

function sectionToTabItem(
  section: ReactElement<ArdoSidebarSectionProps>,
  active: boolean
): SidebarTabItem {
  const { icon, id, label, to } = section.props
  return { active, icon: icon === undefined ? resolveSectionIcon(id) : icon, key: id, label, to }
}

function routePathToString(to: RoutePath | undefined): string | undefined {
  return typeof to === "string" ? to : undefined
}

function sidebarItemsFromChildren(children: ReactNode): SidebarItemType[] {
  const items: SidebarItemType[] = []

  for (const child of flattenSidebarChildren(children)) {
    items.push(...sidebarItemsFromChild(child))
  }

  return items
}

function sidebarItemsFromChild(child: ReactNode): SidebarItemType[] {
  if (!isValidElement(child)) return []
  if (isSidebarLinkElement(child)) return [sidebarItemFromLink(child)]
  if (isSidebarGroupElement(child)) return [sidebarItemFromGroup(child)]
  if (isGeneratedSidebarElement(child)) return generatedSidebarItemsFromElement(child)
  return []
}

function sidebarItemFromLink(child: ReactElement<ArdoSidebarLinkProps>): SidebarItemType {
  return {
    text: textFromNode(child.props.children),
    link: routePathToString(child.props.to),
  }
}

function sidebarItemFromGroup(child: ReactElement<ArdoSidebarGroupProps>): SidebarItemType {
  const childItems = sidebarItemsFromChildren(child.props.children)
  return {
    text: child.props.title,
    link: routePathToString(child.props.to),
    collapsed: child.props.collapsed,
    items: childItems.length === 0 ? undefined : childItems,
  }
}

function flattenSidebarChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      result.push(...flattenSidebarChildren(child.props.children))
    } else {
      result.push(child)
    }
  }
  return result
}

function textFromNode(node: ReactNode): string {
  const text = Children.toArray(node)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("")
    .trim()
  return text === "" ? "Untitled" : text
}

function isSidebarChildActive(child: ReactElement, currentPath: string): boolean {
  if (isSidebarLinkElement(child)) {
    return child.props.to === currentPath
  }
  if (isSidebarGroupElement(child)) {
    const groupProps = child.props
    return (
      groupProps.to === currentPath ||
      (groupProps.children != null && checkChildrenActive(groupProps.children, currentPath))
    )
  }
  return false
}

function checkChildrenActive(children: ReactNode, currentPath: string): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && isSidebarChildActive(child, currentPath)
  )
}

function isSidebarLinkElement(child: ReactElement): child is ReactElement<ArdoSidebarLinkProps> {
  return child.type === ArdoSidebarLink
}

function isSidebarGroupElement(child: ReactElement): child is ReactElement<ArdoSidebarGroupProps> {
  return child.type === ArdoSidebarGroup
}

function isGeneratedSidebarElement(
  child: ReactElement
): child is ReactElement<ArdoGeneratedSidebarProps> {
  return typeof generatedSidebarItemsResolver(child) === "function"
}

function generatedSidebarItemsFromElement(
  child: ReactElement<ArdoGeneratedSidebarProps>
): SidebarItemType[] {
  return generatedSidebarItemsResolver(child)?.(child.props.section) ?? []
}

function generatedSidebarItemsResolver(child: ReactElement) {
  return hasGeneratedSidebarItemsResolver(child.type)
    ? child.type.ardoGeneratedSidebarItems
    : undefined
}

function hasGeneratedSidebarItemsResolver(value: unknown): value is {
  ardoGeneratedSidebarItems: (section: string) => SidebarItemType[]
} {
  if (typeof value !== "function") return false
  if (!("ardoGeneratedSidebarItems" in value)) return false
  return typeof value.ardoGeneratedSidebarItems === "function"
}
