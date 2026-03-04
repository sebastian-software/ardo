import { type ReactNode } from "react"
import * as styles from "./Steps.css"

export interface StepsProps {
  /** Content to display — expects an ordered list (`<ol>`) from MDX */
  children: ReactNode
}

/**
 * A wrapper for ordered lists that renders numbered step indicators.
 *
 * @example
 * ```mdx
 * <Steps>
 * 1. Install the package
 * 2. Configure your site
 * 3. Start writing
 * </Steps>
 * ```
 */
export function Steps({ children }: StepsProps) {
  return <div className={styles.steps}>{children}</div>
}
