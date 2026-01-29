import { type ReactNode } from "react"

type ContainerType = "tip" | "warning" | "danger" | "info" | "note"

interface ContainerProps {
  type: ContainerType
  title?: string
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
  tip: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18h6M12 2v1M12 21v-6M4.22 4.22l.71.71M19.07 4.93l-.71.71M1 12h2M21 12h2M4.22 19.78l.71-.71M19.07 19.07l-.71-.71" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  danger: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  note: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
}

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

export function Tip({ title, children }: Omit<ContainerProps, "type">) {
  return (
    <Container type="tip" title={title}>
      {children}
    </Container>
  )
}

export function Warning({ title, children }: Omit<ContainerProps, "type">) {
  return (
    <Container type="warning" title={title}>
      {children}
    </Container>
  )
}

export function Danger({ title, children }: Omit<ContainerProps, "type">) {
  return (
    <Container type="danger" title={title}>
      {children}
    </Container>
  )
}

export function Info({ title, children }: Omit<ContainerProps, "type">) {
  return (
    <Container type="info" title={title}>
      {children}
    </Container>
  )
}

export function Note({ title, children }: Omit<ContainerProps, "type">) {
  return (
    <Container type="note" title={title}>
      {children}
    </Container>
  )
}
