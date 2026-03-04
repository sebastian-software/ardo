import { type ComponentProps, type ReactNode } from "react"
import { Link } from "react-router"
import * as styles from "./Hero.css"

/** Internal route path from React Router */
type RoutePath = ComponentProps<typeof Link>["to"]

/** External URL starting with http:// or https:// */
type ExternalUrl = `http://${string}` | `https://${string}`

export interface HeroAction {
  /** Button text */
  text: string
  /** Link destination - internal route path or external URL */
  link: RoutePath | ExternalUrl
  /** Visual theme: "brand" for primary, "alt" for secondary */
  theme?: "brand" | "alt"
  /** Optional icon as ReactNode (e.g. Lucide icon component) */
  icon?: ReactNode
}

export interface HeroImage {
  /** Image for light mode */
  light: string
  /** Image for dark mode */
  dark?: string
  /** Alt text for the image */
  alt?: string
}

export interface HeroProps {
  /** Large title displayed prominently */
  name?: string
  /** Secondary text below the name */
  text?: string
  /** Descriptive tagline */
  tagline?: string
  /** Hero image - can be a string URL or an object with light/dark variants */
  image?: string | HeroImage
  /** Call-to-action buttons */
  actions?: HeroAction[]
  /** Additional CSS class */
  className?: string
  /** Version string displayed as a pill badge above the name */
  version?: string
}

/**
 * Hero section component for landing pages.
 *
 * @example
 * ```
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
export function Hero({ name, text, tagline, image, actions, className, version }: HeroProps) {
  const imageUrl = typeof image === "string" ? image : image?.light
  const imageAlt = typeof image === "string" ? name : (image?.alt ?? name)

  return (
    <section className={className ?? styles.hero}>
      <div className={`${styles.heroContainer} ${styles.heroAnimate}`}>
        {image && (
          <div>
            <img src={imageUrl} alt={imageAlt} />
          </div>
        )}

        <div>
          {version && <span className={styles.heroVersion}>v{version}</span>}
          {name && <h1 className={styles.heroName}>{name}</h1>}
          {text && <p className={styles.heroText}>{text}</p>}
          {tagline && <p className={styles.heroTagline}>{tagline}</p>}

          {actions && actions.length > 0 && (
            <div className={styles.heroActions}>
              {actions.map((action, index) => {
                const link = action.link
                const isExternal =
                  typeof link === "string" &&
                  (link.startsWith("http://") || link.startsWith("https://"))
                const actionClass = `${styles.heroAction} ${action.theme === "alt" ? styles.heroActionAlt : styles.heroActionBrand}`

                const content = (
                  <>
                    {action.icon}
                    {action.text}
                  </>
                )

                if (isExternal) {
                  return (
                    <a
                      key={index}
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
                  <Link key={index} to={link} className={actionClass}>
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
