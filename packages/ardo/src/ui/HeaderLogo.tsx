import * as styles from "./Header.css"

export type ArdoLogo = { light: string; dark: string } | string

export function HeaderLogo({ alt, logo }: { alt: string; logo: ArdoLogo }) {
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
