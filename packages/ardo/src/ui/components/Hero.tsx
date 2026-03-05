import type { ComponentProps, ReactNode } from "react"

import { Link } from "react-router"

import * as styles from "./Hero.css"

/** Internal route path from React Router */
type RoutePath = ComponentProps<typeof Link>["to"]

export interface ArdoHeroAction {
  /** Button text */
  text: string
  /** Link destination - internal route path or external URL */
  link: RoutePath
  /** Visual theme: "brand" for primary, "alt" for secondary */
  theme?: "alt" | "brand"
  /** Optional icon as ReactNode (e.g. Lucide icon component) */
  icon?: ReactNode
}

export interface ArdoHeroImage {
  /** Image for light mode */
  light: string
  /** Image for dark mode */
  dark?: string
  /** Alt text for the image */
  alt?: string
}

export interface ArdoHeroProps {
  /** Large title displayed prominently */
  name?: string
  /** Secondary text below the name */
  text?: string
  /** Descriptive tagline */
  tagline?: string
  /** Hero image - can be a string URL or an object with light/dark variants */
  image?: ArdoHeroImage | string
  /** Call-to-action buttons */
  actions?: ArdoHeroAction[]
  /** Additional CSS class */
  className?: string
  /** Version string displayed as a pill badge above the name */
  version?: string
}

/**
 * Hero section component for landing pages.
 *
 * @example
 * ```tsx
 * import { ArrowRight, Github } from "lucide-react"
 *
 * <Hero
 *   name="Ardo"
 *   text="React-first Documentation"
 *   tagline="Build beautiful documentation sites with React."
 *   image="/logo.svg"
 *   actions={[
 *     { text: "Get Started", link: "/guide/getting-started", theme: "brand", icon: <ArrowRight size={16} /> },
 *     { text: "GitHub", link: "https://github.com/...", theme: "alt", icon: <Github size={16} /> }
 *   ]}
 * />
 * ```
 */
export function ArdoHero({
  name,
  text,
  tagline,
  image,
  actions,
  className,
  version,
}: ArdoHeroProps) {
  const imageUrl = typeof image === "string" ? image : (image?.light ?? "")
  const imageAlt = typeof image === "string" ? (name ?? "") : (image?.alt ?? name ?? "")
  const hasImage = imageUrl !== ""
  const hasVersion = (version ?? "") !== ""
  const hasName = (name ?? "") !== ""
  const hasText = (text ?? "") !== ""
  const hasTagline = (tagline ?? "") !== ""
  const hasActions = (actions?.length ?? 0) > 0

  return (
    <section className={className ?? styles.hero}>
      <div className={`${styles.heroContainer} ${styles.heroAnimate}`}>
        {hasImage && (
          <div>
            <img src={imageUrl} alt={imageAlt} />
          </div>
        )}

        <div>
          {hasVersion && <span className={styles.heroVersion}>v{version}</span>}
          {hasName && <h1 className={styles.heroName}>{name}</h1>}
          {hasText && <p className={styles.heroText}>{text}</p>}
          {hasTagline && <p className={styles.heroTagline}>{tagline}</p>}

          {hasActions && (
            <div className={styles.heroActions}>
              {actions?.map((action) => {
                const link = action.link
                const isExternal =
                  typeof link === "string" &&
                  (link.startsWith("http://") || link.startsWith("https://"))
                const actionClass = `${styles.heroAction} ${action.theme === "alt" ? styles.heroActionAlt : styles.heroActionBrand}`
                const actionKey = typeof link === "string" ? `${link}-${action.text}` : action.text

                const content = (
                  <>
                    {action.icon}
                    {action.text}
                  </>
                )

                if (isExternal) {
                  return (
                    <a
                      key={actionKey}
                      href={link}
                      className={actionClass}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <Link key={actionKey} to={link} className={actionClass}>
                    {content}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
