import type { ReactNode } from "react"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import * as styles from "./Container.css"

export type ArdoContainerType = "danger" | "info" | "note" | "tip" | "warning"

export type ArdoContainerProps = {
  /** Container type determining the style */
  type: ArdoContainerType
  /** Optional custom title */
  title?: string
  /** Content to display inside the container */
  children: ReactNode
}

const icons: Record<ArdoContainerType, ReactNode> = {
  tip: <ChromeIcon name="tip" />,
  warning: <ChromeIcon name="warning" />,
  danger: <ChromeIcon name="danger" />,
  info: <ChromeIcon name="info" />,
  note: <ChromeIcon name="note" />,
}

/**
 * A styled container for callouts, tips, warnings, etc.
 */
export function ArdoContainer({ type, title, children }: ArdoContainerProps) {
  const labels = useArdoLabels()
  const hasCustomTitle = title != null && title !== "" && title !== labels.container[type]

  return (
    <div className={styles.container({ type })}>
      <span className={styles.containerIcon({ type })}>{icons[type]}</span>
      <div className={styles.containerBody}>
        {hasCustomTitle && <p className={styles.containerTitle({ type })}>{title}</p>}
        <div className={styles.containerContent}>{children}</div>
      </div>
    </div>
  )
}

export type ArdoTipProps = {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A tip container for helpful information.
 */
export function ArdoTip({ title, children }: ArdoTipProps) {
  return (
    <ArdoContainer type="tip" title={title}>
      {children}
    </ArdoContainer>
  )
}

export type ArdoWarningProps = {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A warning container for cautionary information.
 */
export function ArdoWarning({ title, children }: ArdoWarningProps) {
  return (
    <ArdoContainer type="warning" title={title}>
      {children}
    </ArdoContainer>
  )
}

export type ArdoDangerProps = {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A danger container for critical warnings.
 */
export function ArdoDanger({ title, children }: ArdoDangerProps) {
  return (
    <ArdoContainer type="danger" title={title}>
      {children}
    </ArdoContainer>
  )
}

export type ArdoInfoProps = {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * An info container for informational content.
 */
export function ArdoInfo({ title, children }: ArdoInfoProps) {
  return (
    <ArdoContainer type="info" title={title}>
      {children}
    </ArdoContainer>
  )
}

export type ArdoNoteProps = {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A note container for additional information.
 */
export function ArdoNote({ title, children }: ArdoNoteProps) {
  return (
    <ArdoContainer type="note" title={title}>
      {children}
    </ArdoContainer>
  )
}
