import { Link } from "@tanstack/react-router"
import { usePageData, useConfig, useThemeConfig } from "../runtime/hooks"
import { Header, SocialLink } from "./Header"
import { Footer } from "./Footer"
import { Nav, NavLink } from "./Nav"

export function HomePage() {
  const pageData = usePageData()
  const config = useConfig()
  const themeConfig = useThemeConfig()

  const hero = pageData?.frontmatter.hero
  const features = pageData?.frontmatter.features

  return (
    <div className="ardo-home">
      <Header
        logo={themeConfig.logo}
        title={themeConfig.siteTitle !== false ? config.title : undefined}
        nav={
          themeConfig.nav && themeConfig.nav.length > 0 ? (
            <Nav>
              {themeConfig.nav.map((item, index) => (
                <NavLink key={index} to={item.link}>
                  {item.text}
                </NavLink>
              ))}
            </Nav>
          ) : undefined
        }
        actions={themeConfig.socialLinks?.map((link, index) => (
          <SocialLink key={index} href={link.link} icon={link.icon} ariaLabel={link.ariaLabel} />
        ))}
      />

      <main className="ardo-home-main">
        {hero && (
          <section className="ardo-hero">
            <div className="ardo-hero-container">
              {hero.image && (
                <div className="ardo-hero-image">
                  <img
                    src={typeof hero.image === "string" ? hero.image : hero.image.light}
                    alt={hero.name || config.title}
                  />
                </div>
              )}

              <div className="ardo-hero-content">
                {hero.name && <h1 className="ardo-hero-name">{hero.name}</h1>}
                {hero.text && <p className="ardo-hero-text">{hero.text}</p>}
                {hero.tagline && <p className="ardo-hero-tagline">{hero.tagline}</p>}

                {hero.actions && hero.actions.length > 0 && (
                  <div className="ardo-hero-actions">
                    {hero.actions.map((action, index) => (
                      <Link
                        key={index}
                        to={action.link}
                        className={`ardo-hero-action ardo-hero-action-${action.theme || "brand"}`}
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
          <section className="ardo-features">
            <div className="ardo-features-container">
              {features.map((feature, index) => (
                <div key={index} className="ardo-feature">
                  {feature.icon && <div className="ardo-feature-icon">{feature.icon}</div>}
                  <h3 className="ardo-feature-title">{feature.title}</h3>
                  <p className="ardo-feature-details">{feature.details}</p>
                  {feature.link && (
                    <Link to={feature.link} className="ardo-feature-link">
                      {feature.linkText || "Learn more"}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
