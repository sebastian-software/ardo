import { t } from "@palamedes/core/macro"
import type { ReactNode } from "ardo/react"
import { useArdoLocale } from "ardo/runtime"
import heroLight from "../assets/hero-light.svg"
import heroDark from "../assets/hero-dark.svg"
import { ArdoHero, ArdoIcon, getRegisteredIconNames } from "ardo/ui"

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
    <ul className={styles.iconGrid} aria-label={t`Registered content icons`}>
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

/** Keep translated object-valued props in macros; MDX attributes remain in guide catalogs. */
export function GalleryHero({ text, tagline }: { text: string; tagline: string }) {
  const locale = useArdoLocale()
  return (
    <ArdoHero
      text={text}
      tagline={tagline}
      image={{ light: heroLight, dark: heroDark, alt: t`Documentation preview` }}
      actions={[
        { text: t`Read the guide`, link: `/${locale}/guide/getting-started`, theme: "brand" },
        {
          text: t`View the source`,
          link: "https://github.com/sebastian-software/ardo",
          theme: "alt",
        },
      ]}
    />
  )
}
