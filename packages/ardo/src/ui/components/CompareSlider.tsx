import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react"
import { Handle, HandleRoot, Item, Provider, Root } from "react-compare-slider/components"
import { useReactCompareSlider } from "react-compare-slider/hooks"

import { useArdoLabels } from "../../runtime/hooks"
import * as styles from "./CompareSlider.css"

const DEFAULT_POSITION = 50
/** Arrow keys move the divider by this many percent; Page Up and Page Down by ten times as much. */
const KEYBOARD_STEP = 2

export type ArdoCompareSliderProps = {
  /** What the two sides show, such as `"Class diagram"`. Names the slider for screen readers. */
  label: string
  /** Shown left of the divider. */
  first: ReactNode
  /** Name of the first side, such as `"Before"`. */
  firstLabel: string
  /** Shown right of the divider. */
  second: ReactNode
  /** Name of the second side, such as `"After"`. */
  secondLabel: string
  /** Where the divider starts, in percent of the width from the left. Defaults to `50`. */
  initial?: number
  /** Additional CSS class. */
  className?: string
}

/** Keeps a position a whole percentage inside the slider's range. */
function clampPosition(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POSITION
  return Math.min(100, Math.max(0, Math.round(value)))
}

/** Where Home, End, Page Up, and Page Down move the divider; arrow keys belong to the library. */
function jumpTarget(key: string, position: number): number | undefined {
  switch (key) {
    case "Home":
      return 0
    case "End":
      return 100
    case "PageUp":
      return clampPosition(position + KEYBOARD_STEP * 10)
    case "PageDown":
      return clampPosition(position - KEYBOARD_STEP * 10)
    default:
      return undefined
  }
}

/**
 * Two views of the same size laid over each other and split by a divider, such as a screenshot
 * before and after a change. The first shows left of the divider and the second right of it.
 *
 * Built on react-compare-slider. The pointer and the arrow keys move the divider. On a touch
 * screen only the handle drags it, so a swipe elsewhere on the comparison still scrolls the page.
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
  const start = clampPosition(initial)
  const [shown, setShown] = useState(start)
  // Stable, so the library keeps its position across this component's renders.
  const onPositionChange = useCallback((next: number) => {
    setShown(Math.round(next))
  }, [])
  const slider = useReactCompareSlider({
    defaultPosition: start,
    keyboardIncrement: `${KEYBOARD_STEP}%`,
    onPositionChange,
  })
  const { position, setPosition } = slider
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = jumpTarget(event.key, position.current)
    if (target === undefined) return
    event.preventDefault()
    setPosition(target)
  }
  const rootClassName = className == null ? styles.root : `${styles.root} ${className}`

  return (
    // The divider moves along physical left and right, so the layout stays left-to-right.
    <div className={rootClassName} dir="ltr">
      <div className={styles.tags} aria-hidden="true">
        <span>← {firstLabel}</span>
        <span>{secondLabel} →</span>
      </div>
      <Provider {...slider}>
        <Root className={styles.stage}>
          <Item item="itemOne" className={styles.layer}>
            {first}
          </Item>
          <Item item="itemTwo" className={styles.layer}>
            {second}
          </Item>
          <HandleRoot
            className={styles.handleRoot}
            aria-label={labels.name(label, firstLabel, secondLabel)}
            aria-valuenow={shown}
            aria-valuetext={labels.value({
              first: firstLabel,
              firstPercent: shown,
              second: secondLabel,
              secondPercent: 100 - shown,
            })}
            onKeyDown={onKeyDown}
          >
            <Handle
              // The library reads the handle color from this custom property.
              style={styles.handleStyle as CSSProperties}
              buttonStyle={styles.handleButtonStyle}
              linesStyle={styles.handleLinesStyle}
            />
          </HandleRoot>
        </Root>
      </Provider>
    </div>
  )
}
