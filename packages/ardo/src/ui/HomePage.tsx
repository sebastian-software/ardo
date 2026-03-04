import { type ReactNode } from "react"
import { Link } from "react-router"
import { useArdoPageData, useArdoConfig } from "../runtime/hooks"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import { ArdoFooter, type ArdoFooterProps } from "./Footer"
import { ArdoFeatures, ArdoFeatureCard } from "./components/Features"
import * as layoutStyles from "./Layout.css"
import * as heroStyles from "./components/Hero.css"

export interface ArdoHomePageProps {
  /** Props passed to the Header component */
  headerProps?: ArdoHeaderProps
  /** Props passed to the Footer component */
  footerProps?: ArdoFooterProps
  /** Custom header element (overrides auto-generated header) */
  header?: ReactNode
  /** Custom footer element (overrides auto-generated footer) */
  footer?: ReactNode
}

export function ArdoHomePage({ headerProps, footerProps, header, footer }: ArdoHomePageProps = {}) {
  const pageData = useArdoPageData()
  const config = useArdoConfig()

  const hero = pageData?.frontmatter.hero
  const features = pageData?.frontmatter.features

  return (
    <div className={layoutStyles.home}>
      {header ?? <ArdoHeader title={config.title} {...headerProps} />}

      <main className={layoutStyles.homeMain}>
        {hero && (
          <section className={heroStyles.hero}>
            <div className={heroStyles.heroContainer}>
              {hero.image && (
                <div>
                  <img
                    src={typeof hero.image === "string" ? hero.image : hero.image.light}
                    alt={hero.name || config.title}
                  />
                </div>
              )}

              <div>
                {hero.name && <h1 className={heroStyles.heroName}>{hero.name}</h1>}
                {hero.text && <p className={heroStyles.heroText}>{hero.text}</p>}
                {hero.tagline && <p className={heroStyles.heroTagline}>{hero.tagline}</p>}

                {hero.actions && hero.actions.length > 0 && (
                  <div className={heroStyles.heroActions}>
                    {hero.actions.map((action, index) => (
                      <Link
                        key={index}
                        to={action.link}
                        className={`${heroStyles.heroAction} ${action.theme === "alt" ? heroStyles.heroActionAlt : heroStyles.heroActionBrand}`}
                      >
                        {action.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {features && features.length > 0 && (
          <ArdoFeatures>
            {features.map((feature, index) => (
              <ArdoFeatureCard
                key={index}
                title={feature.title}
                icon={feature.icon}
                link={feature.link}
                linkText={feature.linkText}
              >
                {feature.details}
              </ArdoFeatureCard>
            ))}
          </ArdoFeatures>
        )}
      </main>

      {footer ?? <ArdoFooter {...footerProps} />}
    </div>
  )
}
