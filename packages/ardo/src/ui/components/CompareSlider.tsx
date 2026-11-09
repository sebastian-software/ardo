import { type CSSProperties, type ReactNode, useState } from "react"

import { useArdoLabels } from "../../runtime/hooks"
import * as styles from "./CompareSlider.css"

const DEFAULT_POSITION = 50

export type ArdoCompareSliderProps = {
  /** What the two sides show, such as `"Class diagram"`. Names the slider for screen readers. */
  label: string
  /** Shown left of the divider. */
  first: ReactNode
  /** Name of the first side, such as `"Before"`. */
  firstLabel: string
  /** Shown right of the divider. It sets the height of the comparison. */
  second: ReactNode
  /** Name of the second side, such as `"After"`. */
  secondLabel: string
  /** Where the divider starts, in percent of the width from the left. Defaults to `50`. */
  initial?: number
  /** Additional CSS class. */
  className?: string
}

/** Keeps the start position a whole percentage inside the slider's range. */
function clampPosition(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POSITION
  return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * Two views of the same size laid over each other and split by a divider, such as a screenshot
 * before and after a change. The first shows left of the divider and the second right of it.
 *
 * A native range input covers the comparison, so the pointer, touch, the arrow keys, and screen
 * readers move the divider without custom event handling. A vertical swipe still scrolls the page.
 * The prerendered page shows the divider at its start position; it moves once the page hydrates.
 *
 * @example
 * ```mdx
 * <CompareSlider
 *   label="Sign-in page"
 *   first={<img src="/before.png" alt="Sign-in page before the redesign" />}
 *   firstLabel="Before"
 *   second={<img src="/after.png" alt="Sign-in page after the redesign" />}
 *   secondLabel="After"
 * />
 * ```
 */
export function ArdoCompareSlider({
  label,
  first,
  firstLabel,
  second,
  secondLabel,
  initial = DEFAULT_POSITION,
  className,
}: ArdoCompareSliderProps) {
  const labels = useArdoLabels().compareSlider
  const [position, setPosition] = useState(() => clampPosition(initial))
  const style: CSSProperties & Record<`--${string}`, string> = {
    [styles.positionProperty]: `${position}%`,
  }
  const rootClassName = className == null ? styles.root : `${styles.root} ${className}`

  return (
    // The divider moves along physical left and right, so the layout stays left-to-right.
    <div className={rootClassName} style={style} dir="ltr">
      <div className={styles.tags} aria-hidden="true">
        <span>← {firstLabel}</span>
        <span>{secondLabel} →</span>
      </div>
      <div className={styles.stage}>
        <div className={styles.layer}>{second}</div>
        <div className={`${styles.layer} ${styles.firstLayer}`}>{first}</div>
        <input
          className={styles.input}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          aria-label={labels.name(label, firstLabel, secondLabel)}
          aria-valuetext={labels.value({
            first: firstLabel,
            firstPercent: position,
            second: secondLabel,
            secondPercent: 100 - position,
          })}
          onChange={(event) => {
            setPosition(Number(event.currentTarget.value))
          }}
        />
        <div className={styles.divider} aria-hidden="true" />
      </div>
    </div>
  )
}
