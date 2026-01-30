import { type ComponentProps } from "react"
import { Link } from "react-router"

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
}

/**
 * Hero section component for landing pages.
 *
 * @example
 * ```tsx
 * <Hero
 *   name="Ardo"
 *   text="React-first Documentation"
 *   tagline="Build beautiful documentation sites with React."
 *   image="/logo.svg"
 *   actions={[
 *     { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
 *     { text: "GitHub", link: "https://github.com/...", theme: "alt" }
 *   ]}
 * />
 * ```
 */
export function Hero({ name, text, tagline, image, actions, className }: HeroProps) {
  const imageUrl = typeof image === "string" ? image : image?.light
  const imageAlt = typeof image === "string" ? name : (image?.alt ?? name)

  return (
    <section className={className ?? "ardo-hero"}>
      <div className="ardo-hero-container">
        {image && (
          <div className="ardo-hero-image">
            <img src={imageUrl} alt={imageAlt} />
          </div>
        )}

        <div className="ardo-hero-content">
          {name && <h1 className="ardo-hero-name">{name}</h1>}
          {text && <p className="ardo-hero-text">{text}</p>}
          {tagline && <p className="ardo-hero-tagline">{tagline}</p>}

          {actions && actions.length > 0 && (
            <div className="ardo-hero-actions">
              {actions.map((action, index) => {
                const link = action.link
                const isExternal =
                  typeof link === "string" &&
                  (link.startsWith("http://") || link.startsWith("https://"))
                const className = `ardo-hero-action ardo-hero-action-${action.theme || "brand"}`

                if (isExternal) {
                  return (
                    <a
                      key={index}
                      href={link}
                      className={className}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {action.text}
                    </a>
                  )
                }

                return (
                  <Link key={index} to={link} className={className}>
                    {action.text}
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
