import type { KeyboardEvent, ReactNode } from "react"

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import * as styles from "./Accordion.css"
import { useCollapsiblePanel } from "./collapsible-panel"
import { ArdoIcon } from "./Icon"

export type ArdoAccordionHeadingLevel = 2 | 3 | 4 | 5 | 6

export type ArdoAccordionGroupProps = {
  /** Accordion items to display. */
  children: ReactNode
  /** When true, opening one accordion closes the currently open item. */
  onlyOneOpen?: boolean
  /** Additional CSS class. */
  className?: string
}

export type ArdoAccordionProps = {
  /** Accordion summary/title. */
  title: ReactNode
  /** Collapsible content. */
  children: ReactNode
  /** Whether the accordion starts open. */
  defaultOpen?: boolean
  /** Optional built-in or custom registered icon name, or a React node shown before the title. */
  icon?: ReactNode | string
  /** Heading level used for the accordion trigger. */
  headingLevel?: ArdoAccordionHeadingLevel
  /** Stable item value used by AccordionGroup only-one-open mode. */
  value?: string
  /** Additional CSS class. */
  className?: string
}

type AccordionGroupState = {
  openValues: readonly string[]
  onlyOneOpen: boolean
  /** Values of the items the group found in its children, whose defaults it knows. */
  knownValues: ReadonlySet<string>
  /** False until the first toggle; until then unknown items follow their own `defaultOpen`. */
  touched: boolean
  setItemOpen: (value: string, open: boolean) => void
  registerDefaultOpen: (value: string) => () => void
}

const AccordionGroupContext = createContext<AccordionGroupState | null>(null)

const ROOT_ATTRIBUTE = "data-ardo-accordion"
const TRIGGER_ATTRIBUTE = "data-ardo-accordion-trigger"
const NAVIGATION_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"])

function AccordionIcon({ icon }: { icon: ReactNode | string }) {
  return (
    <span className={styles.leadingIcon} aria-hidden="true">
      {typeof icon === "string" ? <ArdoIcon name={icon} size={18} /> : icon}
    </span>
  )
}

function fallbackValue(index: number): string {
  return `ardo-accordion-${index}`
}

type GroupScan = { defaultOpenValues: string[]; knownValues: Set<string> }

function resolveAccordionGroupChildren(children: ReactNode) {
  const scan: GroupScan = { defaultOpenValues: [], knownValues: new Set() }
  const normalizedChildren = normalizeGroupNode(children, scan)
  return { ...scan, normalizedChildren }
}

/**
 * Finds the group's items in the element tree, also inside wrapper elements
 * that pass them through as children, and gives each a stable value. Nested
 * groups and accordion panels are left alone: their items are independent.
 */
function normalizeGroupNode(node: ReactNode, scan: GroupScan): ReactNode {
  if (Array.isArray(node)) return Children.map(node, (child) => normalizeGroupNode(child, scan))
  if (!isValidElement<{ children?: ReactNode } & Partial<ArdoAccordionProps>>(node)) return node
  if (node.type === ArdoAccordionGroup) return node

  let overrides: { value: string } | { children: ReactNode }
  if (node.type === ArdoAccordion) {
    const value = node.props.value ?? fallbackValue(scan.knownValues.size)
    scan.knownValues.add(value)
    if (node.props.defaultOpen === true) scan.defaultOpenValues.push(value)
    if (node.props.value != null) return node
    overrides = { value }
  } else {
    const nested = node.props.children
    if (nested == null || typeof nested !== "object") return node
    overrides = { children: normalizeGroupNode(nested, scan) }
  }
  return cloneElement(node, overrides)
}

/**
 * Arrow-key navigation between the triggers of one accordion group, after the
 * WAI-ARIA APG accordion pattern: ArrowDown/ArrowUp move with wrap-around,
 * Home/End jump to the first/last trigger. Triggers of nested groups belong to
 * their own group and are skipped.
 */
function handleGroupKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (event.defaultPrevented || !NAVIGATION_KEYS.has(event.key)) return

  const root = event.currentTarget
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.hasAttribute(TRIGGER_ATTRIBUTE)) return
  if (target.closest(`[${ROOT_ATTRIBUTE}]`) !== root) return

  const triggers = [...root.querySelectorAll<HTMLElement>(`[${TRIGGER_ATTRIBUTE}]`)].filter(
    (trigger) => trigger.closest(`[${ROOT_ATTRIBUTE}]`) === root
  )
  const index = triggers.indexOf(target)
  const last = triggers.length - 1
  let next: number
  if (event.key === "Home") next = 0
  else if (event.key === "End") next = last
  else if (event.key === "ArrowDown") next = index === last ? 0 : index + 1
  else next = index === 0 ? last : index - 1

  event.preventDefault()
  triggers[next]?.focus()
}

type OpenChange = { value: string; open: boolean; onlyOneOpen: boolean }

function nextOpenValues(
  current: readonly string[],
  { value, open, onlyOneOpen }: OpenChange
): readonly string[] {
  if (!open) return current.filter((openValue) => openValue !== value)
  if (onlyOneOpen) return [value]
  return current.includes(value) ? current : [...current, value]
}

/**
 * Group container for accordion items.
 *
 * Follows the WAI-ARIA APG accordion pattern (see ADR 0026): heading-wrapped
 * button triggers, labelled region panels, and arrow-key navigation between
 * the group's triggers.
 */
export function ArdoAccordionGroup({
  children,
  onlyOneOpen = false,
  className,
}: ArdoAccordionGroupProps) {
  const { defaultOpenValues, knownValues, normalizedChildren } = useMemo(
    () => resolveAccordionGroupChildren(children),
    [children]
  )
  const [state, setState] = useState<{ openValues: readonly string[]; touched: boolean }>(() => ({
    openValues: onlyOneOpen ? defaultOpenValues.slice(0, 1) : defaultOpenValues,
    touched: false,
  }))
  // Items a custom component renders itself are invisible to the scan above.
  // Outside only-one-open mode they register their `defaultOpen`, which the
  // first toggle takes over.
  const hiddenDefaultOpenRef = useRef(new Set<string>())
  const registerDefaultOpen = useCallback((value: string) => {
    hiddenDefaultOpenRef.current.add(value)
    return () => {
      hiddenDefaultOpenRef.current.delete(value)
    }
  }, [])
  const setItemOpen = useCallback(
    (value: string, open: boolean) => {
      setState((current) => {
        const openValues = current.touched
          ? current.openValues
          : [...current.openValues, ...hiddenDefaultOpenRef.current]
        return {
          openValues: nextOpenValues(openValues, { value, open, onlyOneOpen }),
          touched: true,
        }
      })
    },
    [onlyOneOpen]
  )
  const group = useMemo(
    () => ({ ...state, onlyOneOpen, knownValues, setItemOpen, registerDefaultOpen }),
    [state, onlyOneOpen, knownValues, setItemOpen, registerDefaultOpen]
  )
  const groupClassName =
    className == null ? styles.accordionGroup : `${styles.accordionGroup} ${className}`

  return (
    <AccordionGroupContext value={group}>
      <div className={groupClassName} {...{ [ROOT_ATTRIBUTE]: "" }} onKeyDown={handleGroupKeyDown}>
        {normalizedChildren}
      </div>
    </AccordionGroupContext>
  )
}

function AccordionItem({
  title,
  children,
  icon,
  headingLevel = 3,
  className,
  open,
  setOpen,
  isRoot,
}: Omit<ArdoAccordionProps, "defaultOpen" | "value"> & {
  open: boolean
  setOpen: (open: boolean) => void
  isRoot: boolean
}) {
  const id = useId()
  const triggerId = `${id}-trigger`
  const panelId = `${id}-panel`
  const { panelRef, hidden } = useCollapsiblePanel(open, () => setOpen(true))
  const accordionClassName =
    className == null ? styles.accordion : `${styles.accordion} ${className}`
  const Heading = `h${headingLevel}` as const
  const openAttribute = open ? { "data-open": "" } : undefined
  const rootAttribute = isRoot ? { [ROOT_ATTRIBUTE]: "" } : undefined

  return (
    <div className={accordionClassName} {...rootAttribute} {...openAttribute}>
      <Heading className={styles.heading} {...openAttribute}>
        <button
          type="button"
          id={triggerId}
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          {...{ [TRIGGER_ATTRIBUTE]: "" }}
          {...openAttribute}
        >
          {icon != null && <AccordionIcon icon={icon} />}
          <span className={styles.title}>{title}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </Heading>
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className={styles.content}
        hidden={hidden}
        {...openAttribute}
      >
        {/* Accordions inside the panel do not join this item's group. */}
        <AccordionGroupContext value={null}>
          <div className={styles.contentInner}>{children}</div>
        </AccordionGroupContext>
      </div>
    </div>
  )
}

/**
 * Collapsible documentation content section.
 *
 * Works standalone or inside an `ArdoAccordionGroup`. Collapsed content
 * stays in the pre-rendered HTML (`hidden="until-found"` once hydrated), so it
 * remains visible to search engines and the browser's find-in-page.
 */
export function ArdoAccordion({
  title,
  children,
  defaultOpen = false,
  icon,
  headingLevel = 3,
  value,
  className,
}: ArdoAccordionProps) {
  const group = use(AccordionGroupContext)
  const [standaloneOpen, setStandaloneOpen] = useState(defaultOpen)
  const generatedValue = useId()
  const resolvedValue = value ?? generatedValue
  // An item the group could not find keeps its own default, except where it
  // could break the single open item of an only-one-open group.
  const registerDefaultOpen =
    group != null && defaultOpen && !group.onlyOneOpen && !group.knownValues.has(resolvedValue)
      ? group.registerDefaultOpen
      : undefined
  useEffect(() => registerDefaultOpen?.(resolvedValue), [registerDefaultOpen, resolvedValue])
  const open =
    group == null
      ? standaloneOpen
      : group.openValues.includes(resolvedValue) || (registerDefaultOpen != null && !group.touched)
  const setOpen =
    group == null
      ? setStandaloneOpen
      : (nextOpen: boolean) => group.setItemOpen(resolvedValue, nextOpen)

  return (
    <AccordionItem
      title={title}
      icon={icon}
      headingLevel={headingLevel}
      className={className}
      open={open}
      setOpen={setOpen}
      isRoot={group == null}
    >
      {children}
    </AccordionItem>
  )
}
