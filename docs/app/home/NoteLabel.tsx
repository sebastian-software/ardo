import type { ReactNode } from "react"

import * as styles from "./home.css"

/** The handwritten topic line above a section heading. */
export function NoteLabel({ children }: { children: ReactNode }) {
  return <p className={styles.noteLabel}>{children}</p>
}
