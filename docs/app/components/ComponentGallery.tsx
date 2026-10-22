import type { ReactNode } from "ardo/react"
import { ArdoIcon, getRegisteredIconNames } from "ardo/ui"

import * as styles from "./component-gallery.css"

export function GalleryPreview({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-label={label} className={styles.preview}>
      {children}
    </section>
  )
}

export function GalleryIcons() {
  return (
    <ul className={styles.iconGrid} aria-label="Registered content icons">
      {getRegisteredIconNames().map((name) => (
        <li key={name} className={styles.iconItem}>
          <span className={styles.iconSamples} aria-hidden="true">
            <ArdoIcon name={name} size={14} />
            <ArdoIcon name={name} size={28} />
          </span>
          <code className={styles.iconName}>{name}</code>
        </li>
      ))}
    </ul>
  )
}
