import { type ReactNode } from "react"
import { Lightbulb, AlertTriangle, XCircle, Info as InfoIcon, FileText } from "lucide-react"

export type ContainerType = "tip" | "warning" | "danger" | "info" | "note"

export interface ContainerProps {
  /** Container type determining the style */
  type: ContainerType
  /** Optional custom title */
  title?: string
  /** Content to display inside the container */
  children: ReactNode
}

const defaultTitles: Record<ContainerType, string> = {
  tip: "TIP",
  warning: "WARNING",
  danger: "DANGER",
  info: "INFO",
  note: "NOTE",
}

const icons: Record<ContainerType, ReactNode> = {
  tip: <Lightbulb size={18} strokeWidth={2.5} />,
  warning: <AlertTriangle size={18} strokeWidth={2.5} />,
  danger: <XCircle size={18} strokeWidth={2.5} />,
  info: <InfoIcon size={18} strokeWidth={2.5} />,
  note: <FileText size={18} strokeWidth={2.5} />,
}

/**
 * A styled container for callouts, tips, warnings, etc.
 */
export function Container({ type, title, children }: ContainerProps) {
  const displayTitle = title || defaultTitles[type]

  return (
    <div className={`ardo-container ardo-container-${type}`}>
      <p className="ardo-container-title">
        <span className="ardo-container-icon">{icons[type]}</span>
        {displayTitle}
      </p>
      <div className="ardo-container-content">{children}</div>
    </div>
  )
}

export interface TipProps {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A tip container for helpful information.
 */
export function Tip({ title, children }: TipProps) {
  return (
    <Container type="tip" title={title}>
      {children}
    </Container>
  )
}

export interface WarningProps {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A warning container for cautionary information.
 */
export function Warning({ title, children }: WarningProps) {
  return (
    <Container type="warning" title={title}>
      {children}
    </Container>
  )
}

export interface DangerProps {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A danger container for critical warnings.
 */
export function Danger({ title, children }: DangerProps) {
  return (
    <Container type="danger" title={title}>
      {children}
    </Container>
  )
}

export interface InfoProps {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * An info container for informational content.
 */
export function Info({ title, children }: InfoProps) {
  return (
    <Container type="info" title={title}>
      {children}
    </Container>
  )
}

export interface NoteProps {
  /** Optional custom title */
  title?: string
  /** Content to display */
  children: ReactNode
}

/**
 * A note container for additional information.
 */
export function Note({ title, children }: NoteProps) {
  return (
    <Container type="note" title={title}>
      {children}
    </Container>
  )
}
