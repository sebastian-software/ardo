import { type ReactNode } from "react"
import { usePageData, useThemeConfig, useSidebar } from "../runtime/hooks"
import { getPrevNextLinks } from "../runtime/sidebar-utils"
import { Link, useLocation } from "react-router"

interface ContentProps {
  children: ReactNode
}

export function Content({ children }: ContentProps) {
  const pageData = usePageData()
  const themeConfig = useThemeConfig()
  const sidebar = useSidebar()
  const location = useLocation()

  const { prev, next } = getPrevNextLinks(sidebar, location.pathname)

  const showEditLink = pageData?.frontmatter.editLink !== false && themeConfig.editLink?.pattern

  const showLastUpdated =
    pageData?.frontmatter.lastUpdated !== false &&
    themeConfig.lastUpdated?.enabled &&
    pageData?.lastUpdated

  const editLink = showEditLink
    ? themeConfig.editLink!.pattern.replace(":path", pageData?.relativePath || "")
    : null

  const lastUpdatedText = showLastUpdated
    ? new Date(pageData!.lastUpdated!).toLocaleDateString(
        undefined,
        themeConfig.lastUpdated?.formatOptions ?? {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : null

  return (
    <article className="ardo-content-container">
      {pageData?.frontmatter.title && (
        <header className="ardo-content-header">
          <h1 className="ardo-content-title">{pageData.frontmatter.title}</h1>
          {pageData.frontmatter.description && (
            <p className="ardo-content-description">{pageData.frontmatter.description}</p>
          )}
        </header>
      )}

      <div className="ardo-content-body">{children}</div>

      <footer className="ardo-content-footer">
        {(showEditLink || showLastUpdated) && (
          <div className="ardo-content-meta">
            {showEditLink && (
              <a
                href={editLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="ardo-edit-link"
              >
                {themeConfig.editLink?.text ?? "Edit this page"}
              </a>
            )}
            {showLastUpdated && (
              <span className="ardo-last-updated">
                {themeConfig.lastUpdated?.text ?? "Last updated"}: {lastUpdatedText}
              </span>
            )}
          </div>
        )}

        {(prev || next) && (
          <nav className="ardo-prev-next">
            {prev ? (
              <Link to={prev.link!} className="ardo-prev-link">
                <span className="ardo-prev-next-label">Previous</span>
                <span className="ardo-prev-next-title">{prev.text}</span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link to={next.link!} className="ardo-next-link">
                <span className="ardo-prev-next-label">Next</span>
                <span className="ardo-prev-next-title">{next.text}</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </footer>
    </article>
  )
}
