import { isValidElement, type ReactElement } from "react"

import * as styles from "./Header.css"

export type ArdoLogo = { light: string; dark: string } | ReactElement | string

export function HeaderLogo({ alt, logo }: { alt: string; logo: ArdoLogo }) {
  // A ready-made element (e.g. an inline SVG mark) is rendered as-is so it can
  // carry its own sizing, accessibility, and currentColor-based tinting.
  if (isValidElement(logo)) {
    return logo
  }

  if (typeof logo === "string") {
    return <img src={logo} alt={alt} className={styles.logo} />
  }

  return (
    <>
      <img src={logo.light} alt={alt} className={`${styles.logo} ${styles.logoLight}`} />
      <img src={logo.dark} alt={alt} className={`${styles.logo} ${styles.logoDark}`} />
    </>
  )
}
