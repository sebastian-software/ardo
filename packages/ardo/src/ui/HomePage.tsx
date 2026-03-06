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

function HomeHeroSection({
  hero,
  fallbackTitle,
}: {
  hero: NonNullable<ReturnType<typeof useArdoPageData>>["frontmatter"]["hero"]
  fallbackTitle: string
}) {
  if (hero === undefined) return null
  const heroImage = hero.image
  const heroActions = hero.actions ?? []
  const heroName = hero.name ?? ""
  return (
    <section className={heroStyles.hero}>
      <div className={heroStyles.heroContainer}>
        {heroImage !== undefined && (
          <div>
            <img
              src={typeof heroImage === "string" ? heroImage : heroImage.light}
              alt={heroName !== "" ? heroName : fallbackTitle}
            />
          </div>
        )}
        <div>
          {heroName !== "" && <h1 className={heroStyles.heroName}>{heroName}</h1>}
          {(hero.text ?? "") !== "" && <p className={heroStyles.heroText}>{hero.text}</p>}
          {(hero.tagline ?? "") !== "" && <p className={heroStyles.heroTagline}>{hero.tagline}</p>}
          {heroActions.length > 0 && (
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
  )
}

function HomeFeaturesSection({
  features,
}: {
  features: NonNullable<ReturnType<typeof useArdoPageData>>["frontmatter"]["features"]
}) {
  const safeFeatures = features ?? []
  if (safeFeatures.length === 0) return null
  return (
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
  )
}

export function ArdoHomePage({ headerProps, footerProps, header, footer }: ArdoHomePageProps = {}) {
  const pageData = useArdoPageData()
  const config = useArdoConfig()

  return (
    <div className={layoutStyles.home}>
      {header ?? <ArdoHeader title={config.title} {...headerProps} />}
      <main className={layoutStyles.homeMain}>
        <HomeHeroSection hero={pageData?.frontmatter.hero} fallbackTitle={config.title} />
        <HomeFeaturesSection features={pageData?.frontmatter.features} />
      </main>
      {footer ?? <ArdoFooter {...footerProps} />}
    </div>
  )
}
