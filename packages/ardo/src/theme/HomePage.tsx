import { Link } from "@tanstack/react-router"
import { usePageData, useConfig } from "../runtime/hooks"
import { Header } from "./Header"
import { Footer } from "./Footer"

export function HomePage() {
  const pageData = usePageData()
  const config = useConfig()

  const hero = pageData?.frontmatter.hero
  const features = pageData?.frontmatter.features

  return (
    <div className="press-home">
      <Header />

      <main className="press-home-main">
        {hero && (
          <section className="press-hero">
            <div className="press-hero-container">
              {hero.image && (
                <div className="press-hero-image">
                  <img
                    src={typeof hero.image === "string" ? hero.image : hero.image.light}
                    alt={hero.name || config.title}
                  />
                </div>
              )}

              <div className="press-hero-content">
                {hero.name && <h1 className="press-hero-name">{hero.name}</h1>}
                {hero.text && <p className="press-hero-text">{hero.text}</p>}
                {hero.tagline && <p className="press-hero-tagline">{hero.tagline}</p>}

                {hero.actions && hero.actions.length > 0 && (
                  <div className="press-hero-actions">
                    {hero.actions.map((action, index) => (
                      <Link
                        key={index}
                        to={action.link}
                        className={`press-hero-action press-hero-action-${action.theme || "brand"}`}
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
          <section className="press-features">
            <div className="press-features-container">
              {features.map((feature, index) => (
                <div key={index} className="press-feature">
                  {feature.icon && <div className="press-feature-icon">{feature.icon}</div>}
                  <h3 className="press-feature-title">{feature.title}</h3>
                  <p className="press-feature-details">{feature.details}</p>
                  {feature.link && (
                    <Link to={feature.link} className="press-feature-link">
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
