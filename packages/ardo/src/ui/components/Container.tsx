import type { ReactNode } from "react"

import { AlertTriangleIcon, FileTextIcon, InfoIcon, LightbulbIcon, XCircleIcon } from "../icons"
import * as styles from "./Container.css"

export type ArdoContainerType = "danger" | "info" | "note" | "tip" | "warning"

export interface ArdoContainerProps {
  /** Container type determining the style */
  type: ArdoContainerType
  /** Optional custom title */
  title?: string
  /** Content to display inside the container */
  children: ReactNode
}

const defaultTitles: Record<ArdoContainerType, string> = {
  tip: "TIP",
  warning: "WARNING",
  danger: "DANGER",
  info: "INFO",
  note: "NOTE",
}

const icons: Record<ArdoContainerType, ReactNode> = {
  tip: <LightbulbIcon size={18} />,
  warning: <AlertTriangleIcon size={18} />,
  danger: <XCircleIcon size={18} />,
  info: <InfoIcon size={18} />,
  note: <FileTextIcon size={18} />,
}

/**
 * A styled container for callouts, tips, warnings, etc.
 */
export function ArdoContainer({ type, title, children }: ArdoContainerProps) {
  const displayTitle = title || defaultTitles[type]

  return (
    <div className={styles.container({ type })}>
      <p className={styles.containerTitle({ type })}>
        <span>{icons[type]}</span>
        {displayTitle}
      </p>
      <div className={styles.containerContent}>{children}</div>
    </div>
  )
}

export interface ArdoTipProps {
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

export interface ArdoWarningProps {
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

export interface ArdoDangerProps {
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

export interface ArdoInfoProps {
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

export interface ArdoNoteProps {
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
