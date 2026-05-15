import type { ReactNode } from "react"

import { createContext, use, useEffect, useId, useMemo, useState } from "react"

import * as styles from "./Accordion.css"
import { ArdoIcon } from "./Icon"

type AccordionGroupContextValue = {
  openItem: string | undefined
  onlyOneOpen: boolean
  setOpenItem: (value: string | undefined) => void
}

const AccordionGroupContext = createContext<AccordionGroupContextValue | null>(null)

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

/**
 * Group container for accordion items.
 */
export function ArdoAccordionGroup({
  children,
  onlyOneOpen = false,
  className,
}: ArdoAccordionGroupProps) {
  const [openItem, setOpenItem] = useState<string | undefined>()
  const contextValue = useMemo(
    () => ({ onlyOneOpen, openItem, setOpenItem }),
    [onlyOneOpen, openItem]
  )
  const groupClassName =
    className == null ? styles.accordionGroup : `${styles.accordionGroup} ${className}`

  return (
    <AccordionGroupContext value={contextValue}>
      <div className={groupClassName}>{children}</div>
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

  useEffect(() => {
    if (context?.onlyOneOpen === true && defaultOpen && context.openItem == null) {
      context.setOpenItem(resolvedValue)
    }
  }, [context, defaultOpen, resolvedValue])

  const toggleOpen = () => {
    if (context?.onlyOneOpen === true) {
      context.setOpenItem(open ? undefined : resolvedValue)
      return
    }

    setIsOpen((current) => !current)
  }

  return (
    <section className={accordionClassName} data-open={open ? "true" : "false"}>
      <h3 className={styles.heading}>
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
      </h3>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={styles.content}
        aria-hidden={!open}
      >
        <div className={styles.contentInner}>{children}</div>
      </div>
    </section>
  )
}
