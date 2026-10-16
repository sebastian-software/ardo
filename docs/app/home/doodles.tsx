// Small hand-drawn marks for the notebook. All of them are decoration, so
// they stay out of the accessibility tree.
import type { CSSProperties } from "react"

import * as styles from "./home.css"

type DoodleProps = { className?: string; style?: CSSProperties }

function track(x: number, y: number): string {
  return `M${x} ${y} l-6 -12 M${x} ${y} l0 -14 M${x} ${y} l6 -12 M${x} ${y} l0 9`
}

/** Owl footprints, walking left to right. */
export function Footprints({ steps = 4, className, style }: DoodleProps & { steps?: number }) {
  const width = steps * 50 + 20
  return (
    <svg
      className={[styles.feet, className].filter(Boolean).join(" ")}
      style={style}
      viewBox={`0 0 ${width} 60`}
      width={width}
      height={60}
      aria-hidden="true"
    >
      {Array.from({ length: steps }, (_, index) => (
        <path key={index} d={track(20 + index * 50, index % 2 === 0 ? 40 : 22)} />
      ))}
    </svg>
  )
}

/** A curved arrow dropping down, then hooking to the right. */
export function ArrowDownRight({ className, style }: DoodleProps) {
  return (
    <svg
      className={[styles.doodle, className].filter(Boolean).join(" ")}
      style={style}
      viewBox="0 0 40 76"
      width={40}
      height={76}
      aria-hidden="true"
    >
      <path d="M8 4 C 2 30, 6 56, 30 70" />
      <path d="M24 59 L30 70 L18 71" />
    </svg>
  )
}

/** A flat arrow swinging up to the right. */
export function ArrowRight({ className, style }: DoodleProps) {
  return (
    <svg
      className={[styles.doodle, className].filter(Boolean).join(" ")}
      style={style}
      viewBox="0 0 80 40"
      width={80}
      height={40}
      aria-hidden="true"
    >
      <path d="M4 30 C 26 34, 50 26, 74 10" />
      <path d="M60 8 L74 10 L68 23" />
    </svg>
  )
}

export function Paperclip({ style }: DoodleProps) {
  return (
    <svg
      className={styles.paperclip}
      style={style}
      viewBox="0 0 24 48"
      width={22}
      height={46}
      aria-hidden="true"
    >
      <path d="M7 40 V10 a5 5 0 0 1 10 0 v26 a3.4 3.4 0 0 1 -6.8 0 V14" />
    </svg>
  )
}

export function CoffeeRing({ className, style }: DoodleProps) {
  return (
    <svg
      className={[styles.coffeeRing, className].filter(Boolean).join(" ")}
      style={style}
      viewBox="0 0 140 140"
      width={150}
      height={150}
      aria-hidden="true"
    >
      <circle cx="70" cy="70" r="52" strokeWidth={8} />
      <circle cx="70" cy="70" r="46" strokeWidth={2} />
    </svg>
  )
}

export function MoonAndStars() {
  return (
    <svg className={styles.doodle} viewBox="0 0 48 40" width={48} height={40} aria-hidden="true">
      <path d="M26 6 a14 14 0 1 0 14 22 a11 11 0 0 1 -14 -22 z" />
      <path d="M38 6 v6 M35 9 h6" />
      <path d="M8 30 v4 M6 32 h4" />
    </svg>
  )
}
