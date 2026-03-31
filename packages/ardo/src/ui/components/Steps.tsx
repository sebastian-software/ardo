import type { ReactNode } from "react"

import * as styles from "./Steps.css"

export interface ArdoStepsProps {
  /** Content to display, typically an ordered list (`<ol>`) */
  children: ReactNode
}

/**
 * A wrapper for step-by-step instructions rendered as an ordered list.
 *
 * @example
 * ```tsx
 * <ArdoSteps>
 *   <ol>
 *     <li>Install the package</li>
 *     <li>Configure your site</li>
 *     <li>Start writing</li>
 *   </ol>
 * </ArdoSteps>
 * ```
 */
export function ArdoSteps({ children }: ArdoStepsProps) {
  return <div className={styles.steps}>{children}</div>
}
