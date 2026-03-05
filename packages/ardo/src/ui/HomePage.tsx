import type { ReactNode } from "react"

import { Link } from "react-router"

import { useArdoConfig, useArdoPageData } from "../runtime/hooks"
import { ArdoFeatureCard, ArdoFeatures } from "./components/Features"
import * as heroStyles from "./components/Hero.css"
import { ArdoFooter, type ArdoFooterProps } from "./Footer"
import { ArdoHeader, type ArdoHeaderProps } from "./Header"
import * as layoutStyles from "./Layout.css"

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
  const heroImage = hero?.image
  const heroActions = hero?.actions ?? []
  const safeFeatures = features ?? []
  const hasHero = hero !== undefined
  const hasHeroImage = heroImage !== undefined
  const heroName = hero?.name ?? ""
  const heroText = hero?.text ?? ""
  const heroTagline = hero?.tagline ?? ""
  const hasHeroActions = heroActions.length > 0
  const hasFeatures = safeFeatures.length > 0

  return (
    <div className={layoutStyles.home}>
      {header ?? <ArdoHeader title={config.title} {...headerProps} />}

      <main className={layoutStyles.homeMain}>
        {hasHero && (
          <section className={heroStyles.hero}>
            <div className={heroStyles.heroContainer}>
              {hasHeroImage && (
                <div>
                  <img
                    src={typeof heroImage === "string" ? heroImage : (heroImage?.light ?? "")}
                    alt={heroName !== "" ? heroName : config.title}
                  />
                </div>
              )}

              <div>
                {heroName !== "" && <h1 className={heroStyles.heroName}>{heroName}</h1>}
                {heroText !== "" && <p className={heroStyles.heroText}>{heroText}</p>}
                {heroTagline !== "" && <p className={heroStyles.heroTagline}>{heroTagline}</p>}

                {hasHeroActions && (
                  <div className={heroStyles.heroActions}>
                    {heroActions.map((action) => (
                      <Link
                        key={`${action.link}-${action.text}`}
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

        {hasFeatures && (
          <ArdoFeatures>
            {safeFeatures.map((feature) => (
              <ArdoFeatureCard
                key={feature.link ?? feature.title}
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
