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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import * as styles from "./Accordion.css"
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
  setItemOpen: (value: string, open: boolean) => void
}

const AccordionGroupContext = createContext<AccordionGroupState | null>(null)

const ROOT_ATTRIBUTE = "data-ardo-accordion"
const TRIGGER_ATTRIBUTE = "data-ardo-accordion-trigger"
const PANEL_HEIGHT_PROPERTY = "--accordion-panel-height"
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

function resolveAccordionGroupChildren(children: ReactNode): {
  defaultOpenValues: string[]
  normalizedChildren: ReactNode
} {
  let accordionIndex = 0
  const defaultOpenValues: string[] = []

  const normalizedChildren = Children.map(children, (child): ReactNode => {
    if (!isValidElement<ArdoAccordionProps>(child) || child.type !== ArdoAccordion) {
      return child
    }

    const value = child.props.value ?? fallbackValue(accordionIndex)
    accordionIndex += 1

    if (child.props.defaultOpen === true) {
      defaultOpenValues.push(value)
    }

    return child.props.value == null ? cloneElement(child, { value }) : child
  })

  return { defaultOpenValues, normalizedChildren }
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
  const { defaultOpenValues, normalizedChildren } = useMemo(
    () => resolveAccordionGroupChildren(children),
    [children]
  )
  const [openValues, setOpenValues] = useState<readonly string[]>(() =>
    onlyOneOpen ? defaultOpenValues.slice(0, 1) : defaultOpenValues
  )
  const setItemOpen = useCallback(
    (value: string, open: boolean) => {
      setOpenValues((current) => nextOpenValues(current, { value, open, onlyOneOpen }))
    },
    [onlyOneOpen]
  )
  const group = useMemo(() => ({ openValues, setItemOpen }), [openValues, setItemOpen])
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

/** Resolve once every CSS transition or animation running on the element settles. */
function animationsSettled(element: HTMLElement): Promise<unknown> {
  // getAnimations() flushes pending style changes, so transitions triggered by
  // the attribute change just before are already included.
  if (typeof element.getAnimations !== "function") return Promise.resolve()
  return Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
}

/** Full panel height including borders, measurable even while the panel is clipped. */
function expandedHeight(panel: HTMLElement): string {
  return `${panel.scrollHeight + panel.offsetHeight - panel.clientHeight}px`
}

function afterTransitions(panel: HTMLElement, isCurrent: () => boolean, callback: () => void) {
  void animationsSettled(panel).then(() => {
    if (isCurrent()) callback()
  })
}

function openPanel(panel: HTMLElement, isCurrent: () => boolean) {
  if (panel.dataset.endingStyle == null) {
    panel.dataset.startingStyle = ""
  } else {
    // Reopened mid-close: continue from the current height.
    panel.style.setProperty(PANEL_HEIGHT_PROPERTY, `${panel.offsetHeight}px`)
    delete panel.dataset.endingStyle
  }
  void panel.offsetHeight
  panel.style.setProperty(PANEL_HEIGHT_PROPERTY, expandedHeight(panel))
  delete panel.dataset.startingStyle
  // Back to auto height so content changes (nested accordions) reflow freely.
  afterTransitions(panel, isCurrent, () => panel.style.removeProperty(PANEL_HEIGHT_PROPERTY))
}

function clearTransitionStyles(panel: HTMLElement) {
  delete panel.dataset.startingStyle
  delete panel.dataset.endingStyle
  panel.style.removeProperty(PANEL_HEIGHT_PROPERTY)
}

function closePanel(panel: HTMLElement, isCurrent: () => boolean, onClosed: () => void) {
  // Transitions cannot start from `auto`: pin the current height first.
  panel.style.setProperty(PANEL_HEIGHT_PROPERTY, `${panel.offsetHeight}px`)
  delete panel.dataset.startingStyle
  void panel.offsetHeight
  panel.dataset.endingStyle = ""
  afterTransitions(panel, isCurrent, () => {
    // Hide before dropping the pinned height, or the panel flashes at full
    // height for a frame until React commits `hidden`.
    panel.setAttribute("hidden", "until-found")
    clearTransitionStyles(panel)
    onClosed()
  })
}

/**
 * Collapse state of one panel: keeps it rendered while its close transition
 * runs, drives the height transition through `--accordion-panel-height` and
 * `data-starting-style` / `data-ending-style`, and turns the closed panel into
 * `hidden="until-found"` so find-in-page can still reveal it.
 */
function useCollapsiblePanel(open: boolean, onReveal: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(open)
  const mountedRef = useRef(false)
  const runRef = useRef(0)
  const skipOpenTransitionRef = useRef(false)

  if (open && !visible) setVisible(true)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel == null) return
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    const run = ++runRef.current
    const isCurrent = () => runRef.current === run
    if (!open) {
      closePanel(panel, isCurrent, () => setVisible(false))
    } else if (skipOpenTransitionRef.current) {
      // A find-in-page match is already visible: reveal without motion.
      skipOpenTransitionRef.current = false
      clearTransitionStyles(panel)
    } else {
      openPanel(panel, isCurrent)
    }
  }, [open])

  // React renders `hidden` only as a boolean, which prerenders as `hidden=""`.
  // Upgrade it after hydration so the browser's find-in-page searches it.
  useLayoutEffect(() => {
    if (!visible) panelRef.current?.setAttribute("hidden", "until-found")
  }, [visible])

  const revealRef = useRef(onReveal)
  useLayoutEffect(() => {
    revealRef.current = onReveal
  })

  useEffect(() => {
    const panel = panelRef.current
    if (panel == null) return
    const handleBeforeMatch = () => {
      skipOpenTransitionRef.current = true
      revealRef.current()
    }
    panel.addEventListener("beforematch", handleBeforeMatch)
    return () => panel.removeEventListener("beforematch", handleBeforeMatch)
  }, [])

  return { panelRef, hidden: !visible }
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
        <div className={styles.contentInner}>{children}</div>
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
  const open = group == null ? standaloneOpen : group.openValues.includes(resolvedValue)
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
