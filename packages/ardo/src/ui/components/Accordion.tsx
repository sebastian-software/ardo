import type { ReactNode } from "react"

import { Accordion } from "@base-ui/react/accordion"
import {
  Children,
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  use,
  useId,
  useMemo,
} from "react"

import * as styles from "./Accordion.css"
import { ArdoIcon } from "./Icon"

const AccordionGroupContext = createContext(false)

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
 * Group container for accordion items.
 *
 * Built on the Base UI Accordion primitive (see ADR 0015), which supplies
 * keyboard behavior, focus management, and ARIA wiring.
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
  const defaultValue = onlyOneOpen ? defaultOpenValues.slice(0, 1) : defaultOpenValues
  const groupClassName =
    className == null ? styles.accordionGroup : `${styles.accordionGroup} ${className}`

  return (
    <AccordionGroupContext value={true}>
      <Accordion.Root
        multiple={!onlyOneOpen}
        defaultValue={defaultValue}
        hiddenUntilFound
        className={groupClassName}
      >
        {normalizedChildren}
      </Accordion.Root>
    </AccordionGroupContext>
  )
}

function AccordionItem({
  title,
  children,
  icon,
  headingLevel = 3,
  value,
  className,
}: Omit<ArdoAccordionProps, "defaultOpen">) {
  const accordionClassName =
    className == null ? styles.accordion : `${styles.accordion} ${className}`
  const hasIcon = icon != null
  const headingRender = createElement(`h${headingLevel}`)

  return (
    <Accordion.Item value={value} className={accordionClassName}>
      <Accordion.Header className={styles.heading} render={headingRender}>
        <Accordion.Trigger className={styles.trigger}>
          {hasIcon && <AccordionIcon icon={icon} />}
          <span className={styles.title}>{title}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}

/**
 * Collapsible documentation content section.
 *
 * Works standalone or inside an `ArdoAccordionGroup`. Collapsed content
 * stays in the pre-rendered HTML (`hidden="until-found"`), so it remains
 * visible to search engines and the browser's find-in-page.
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
  const insideGroup = use(AccordionGroupContext)
  const resolvedValue = value ?? generatedId
  const item = (
    <AccordionItem
      title={title}
      icon={icon}
      headingLevel={headingLevel}
      value={resolvedValue}
      className={className}
    >
      {children}
    </AccordionItem>
  )

  if (insideGroup) {
    return item
  }

  return (
    <Accordion.Root multiple defaultValue={defaultOpen ? [resolvedValue] : []} hiddenUntilFound>
      {item}
    </Accordion.Root>
  )
}
