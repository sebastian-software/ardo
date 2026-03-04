import { type ReactNode } from "react"
import { useArdoPageData, useArdoTheme, useArdoSidebar } from "../runtime/hooks"
import { getPrevNextLinks } from "../runtime/sidebar-utils"
import { Link, useLocation } from "react-router"
import { useBareContent } from "./BareContent"
import * as docStyles from "./DocPage.css"
import * as footerStyles from "./Footer.css"
import { ardoContent } from "./content.css"

interface ContentProps {
  children: ReactNode
}

export function ArdoContent({ children }: ContentProps) {
  const isBare = useBareContent()
  const pageData = useArdoPageData()
  const themeConfig = useArdoTheme()
  const sidebar = useArdoSidebar()
  const location = useLocation()

  if (isBare) {
    return <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>
  }

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
    <article className={docStyles.contentContainer}>
      {pageData?.frontmatter.title && (
        <header className={docStyles.contentHeader}>
          <h1 className={docStyles.contentTitle}>{pageData.frontmatter.title}</h1>
          {pageData.frontmatter.description && (
            <p className={docStyles.contentDescription}>{pageData.frontmatter.description}</p>
          )}
        </header>
      )}

      <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>

      <footer className={footerStyles.contentFooter}>
        {(showEditLink || showLastUpdated) && (
          <div className={footerStyles.contentMeta}>
            {showEditLink && (
              <a
                href={editLink!}
                target="_blank"
                rel="noopener noreferrer"
                className={footerStyles.editLink}
              >
                {themeConfig.editLink?.text ?? "Edit this page"}
              </a>
            )}
            {showLastUpdated && (
              <span>
                {themeConfig.lastUpdated?.text ?? "Last updated"}: {lastUpdatedText}
              </span>
            )}
          </div>
        )}

        {(prev || next) && (
          <nav className={footerStyles.prevNext} aria-label="Page navigation">
            {prev ? (
              <Link to={prev.link!} className={footerStyles.prevLink}>
                <span className={footerStyles.prevNextLabel}>Previous</span>
                <span className={footerStyles.prevNextTitle}>{prev.text}</span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link to={next.link!} className={footerStyles.nextLink}>
                <span className={footerStyles.prevNextLabel}>Next</span>
                <span className={footerStyles.prevNextTitle}>{next.text}</span>
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
