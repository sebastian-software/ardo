import type { ReactNode } from "react"

import { Link } from "react-router"

import * as styles from "./Card.css"
import { ArdoIcon } from "./Icon"

export type ArdoCardGroupColumns = 1 | 2 | 3 | 4

export type ArdoCardGroupProps = {
  /** Cards to display in the group. */
  children: ReactNode
  /** Preferred number of columns on wide screens. */
  cols?: ArdoCardGroupColumns
  /** Additional CSS class. */
  className?: string
}

export type ArdoCardProps = {
  /** Card title. */
  title: string
  /** Optional registered icon name or custom React node. */
  icon?: ReactNode | string
  /** Card content. */
  children?: ReactNode
  /** Optional destination. When set, the full card is clickable. */
  href?: string
  /** Additional CSS class. */
  className?: string
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")
}

function CardIcon({ icon }: { icon: ReactNode | string }) {
  return (
    <span className={styles.cardIcon} aria-hidden="true">
      {typeof icon === "string" ? <ArdoIcon name={icon} size={20} /> : icon}
    </span>
  )
}

function CardContent({
  title,
  icon,
  children,
}: Pick<ArdoCardProps, "children" | "icon" | "title">) {
  const hasIcon = icon != null
  const hasChildren = children != null

  return (
    <>
      <span className={styles.cardHeader}>
        {hasIcon && <CardIcon icon={icon} />}
        <span className={styles.cardTitle}>{title}</span>
      </span>
      {hasChildren && <span className={styles.cardBody}>{children}</span>}
    </>
  )
}

/**
 * General-purpose documentation card.
 *
 * Cards can be static content blocks or clickable navigation items when `href` is provided.
 */
export function ArdoCard({ title, icon, children, href, className }: ArdoCardProps) {
  const hasHref = (href ?? "") !== ""
  const cardClassName = className == null ? styles.card : `${styles.card} ${className}`

  if (!hasHref) {
    return (
      <div className={cardClassName}>
        <CardContent title={title} icon={icon}>
          {children}
        </CardContent>
      </div>
    )
  }

  const hrefValue = href ?? ""

  if (isExternalHref(hrefValue)) {
    return (
      <a className={cardClassName} href={hrefValue} target="_blank" rel="noopener noreferrer">
        <CardContent title={title} icon={icon}>
          {children}
        </CardContent>
      </a>
    )
  }

  return (
    <Link className={cardClassName} to={hrefValue}>
      <CardContent title={title} icon={icon}>
        {children}
      </CardContent>
    </Link>
  )
}

/**
 * Responsive grid for documentation cards.
 */
export function ArdoCardGroup({ children, cols = 2, className }: ArdoCardGroupProps) {
  const groupClassName = className == null ? styles.cardGroup : `${styles.cardGroup} ${className}`

  return (
    <div className={groupClassName} data-cols={cols}>
      {children}
    </div>
  )
}
