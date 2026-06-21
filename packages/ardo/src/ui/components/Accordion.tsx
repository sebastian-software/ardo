import type { ElementType, ReactNode } from "react"

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useId,
  useMemo,
  useState,
} from "react"

import * as styles from "./Accordion.css"
import { ArdoIcon } from "./Icon"

type AccordionGroupContextValue = {
  openItem: string | undefined
  onlyOneOpen: boolean
  setOpenItem: (value: string | undefined) => void
}

const AccordionGroupContext = createContext<AccordionGroupContextValue | null>(null)

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
  /** Optional registered icon name or custom React node shown before the title. */
  icon?: ReactNode | string
  /** Heading level used for the accordion trigger. */
  headingLevel?: ArdoAccordionHeadingLevel
  /** Stable item value used by AccordionGroup only-one-open mode. */
  value?: string
  /** Additional CSS class. */
  className?: string
}

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
  defaultOpenValue: string | undefined
  normalizedChildren: ReactNode
} {
  let accordionIndex = 0
  let defaultOpenValue: string | undefined

  const normalizedChildren = Children.map(children, (child): ReactNode => {
    if (!isValidElement<ArdoAccordionProps>(child) || child.type !== ArdoAccordion) {
      return child
    }

    const value = child.props.value ?? fallbackValue(accordionIndex)
    accordionIndex += 1

    if (defaultOpenValue == null && child.props.defaultOpen === true) {
      defaultOpenValue = value
    }

    return child.props.value == null ? cloneElement(child, { value }) : child
  })

  return { defaultOpenValue, normalizedChildren }
}

/**
 * Group container for accordion items.
 */
export function ArdoAccordionGroup({
  children,
  onlyOneOpen = false,
  className,
}: ArdoAccordionGroupProps) {
  const { defaultOpenValue, normalizedChildren } = useMemo(
    () => resolveAccordionGroupChildren(children),
    [children]
  )
  const [openItem, setOpenItem] = useState<string | undefined>(() =>
    onlyOneOpen ? defaultOpenValue : undefined
  )
  const contextValue = useMemo(
    () => ({ onlyOneOpen, openItem, setOpenItem }),
    [onlyOneOpen, openItem]
  )
  const groupClassName =
    className == null ? styles.accordionGroup : `${styles.accordionGroup} ${className}`

  return (
    <AccordionGroupContext value={contextValue}>
      <div className={groupClassName}>{normalizedChildren}</div>
    </AccordionGroupContext>
  )
}

/**
 * Collapsible documentation content section.
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
  const generatedId = useId()
  const context = use(AccordionGroupContext)
  const resolvedValue = value ?? generatedId
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const groupedOpen = context?.onlyOneOpen === true ? context.openItem === resolvedValue : isOpen
  const open = !context?.onlyOneOpen ? isOpen : groupedOpen
  const accordionClassName =
    className == null ? styles.accordion : `${styles.accordion} ${className}`
  const contentId = `${generatedId}-content`
  const triggerId = `${generatedId}-trigger`
  const hasIcon = icon != null
  const Heading = `h${headingLevel}` as ElementType

  const toggleOpen = () => {
    if (context?.onlyOneOpen === true) {
      context.setOpenItem(open ? undefined : resolvedValue)
      return
    }

    setIsOpen((current) => !current)
  }

  return (
    <section className={accordionClassName} data-open={open ? "true" : "false"}>
      <Heading className={styles.heading}>
        <button
          id={triggerId}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggleOpen}
        >
          {hasIcon && <AccordionIcon icon={icon} />}
          <span className={styles.title}>{title}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </Heading>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={styles.content}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        <div className={styles.contentInner}>{children}</div>
      </div>
    </section>
  )
}
