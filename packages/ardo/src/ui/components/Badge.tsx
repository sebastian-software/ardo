import type { ReactNode } from "react"

import * as styles from "./Badge.css"

export type ArdoBadgeVariant = "danger" | "default" | "info" | "success" | "warning"

export type ArdoBadgeProps = {
  /** Visual style for the badge. */
  variant?: ArdoBadgeVariant
  /** Optional leading icon. */
  icon?: ReactNode
  /** Inline badge content. */
  children: ReactNode
}

/**
 * Inline status label for documentation content.
 */
export function ArdoBadge({ variant = "default", icon, children }: ArdoBadgeProps) {
  return (
    <span className={styles.badge({ variant })}>
      {icon != null && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  )
}
