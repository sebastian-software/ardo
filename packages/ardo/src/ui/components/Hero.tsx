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
function HeroActionButton({ action }: { action: ArdoHeroAction }) {
  const link = action.link
  const isExternal =
    typeof link === "string" && (link.startsWith("http://") || link.startsWith("https://"))
  const cls = `${styles.heroAction} ${action.theme === "alt" ? styles.heroActionAlt : styles.heroActionBrand}`
  const content = (
    <>
      {action.icon}
      {action.text}
    </>
  )

  if (isExternal) {
    return (
      <a href={link} className={cls} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }
  return (
    <Link to={link} className={cls}>
      {content}
    </Link>
  )
}

function resolveHeroImage(image: ArdoHeroProps["image"], name: string | undefined) {
  const url = typeof image === "string" ? image : (image?.light ?? "")
  const alt = typeof image === "string" ? (name ?? "") : (image?.alt ?? name ?? "")
  return { url, alt }
}

export function ArdoHero({
  name,
  text,
  tagline,
  image,
  actions,
  className,
  version,
}: ArdoHeroProps) {
  const img = resolveHeroImage(image, name)

  return (
    <section className={className ?? styles.hero}>
      <div className={`${styles.heroContainer} ${styles.heroAnimate}`}>
        {img.url !== "" && (
          <div>
            <img src={img.url} alt={img.alt} />
          </div>
        )}
        <div>
          {(version ?? "") !== "" && <span className={styles.heroVersion}>v{version}</span>}
          {(name ?? "") !== "" && <h1 className={styles.heroName}>{name}</h1>}
          {(text ?? "") !== "" && <p className={styles.heroText}>{text}</p>}
          {(tagline ?? "") !== "" && <p className={styles.heroTagline}>{tagline}</p>}
          {(actions?.length ?? 0) > 0 && (
            <div className={styles.heroActions}>
              {actions?.map((action) => {
                const key =
                  typeof action.link === "string" ? `${action.link}-${action.text}` : action.text
                return <HeroActionButton key={key} action={action} />
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
