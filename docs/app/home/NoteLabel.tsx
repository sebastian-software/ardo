import type { ReactNode } from "react"

import * as styles from "./home.css"

/** The handwritten "note #n · topic" line above a section heading. */
export function NoteLabel({ number, children }: { number: number; children: ReactNode }) {
  return (
    <p className={styles.noteLabel}>
      <span className={styles.noteNumber}>note #{number}</span> · {children}
    </p>
  )
}
