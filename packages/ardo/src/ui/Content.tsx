import type { ReactNode } from "react"

import { Link, useLocation } from "react-router"

import { useArdoPageData, useArdoSidebar, useArdoSiteConfig } from "../runtime/hooks"
import { getPrevNextLinks } from "../runtime/sidebar-utils"
import { useBareContent } from "./BareContent"
import { ardoContent } from "./content.css"
import * as docStyles from "./DocPage.css"
import * as footerStyles from "./Footer.css"

interface ContentProps {
  children: ReactNode
  /** Edit link configuration (overrides ArdoSiteConfig) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (overrides ArdoSiteConfig) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
}

export function ArdoContent({ children, editLink, lastUpdated }: ContentProps) {
  const isBare = useBareContent()
  const pageData = useArdoPageData()
  const siteConfig = useArdoSiteConfig()
  const sidebar = useArdoSidebar()
  const location = useLocation()

  if (isBare) {
    return <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>
  }

  const { prev, next } = getPrevNextLinks(sidebar, location.pathname)

  const resolvedEditLink = editLink ?? siteConfig.editLink
  const resolvedLastUpdated = lastUpdated ?? siteConfig.lastUpdated

  const showEditLink = pageData?.frontmatter.editLink !== false && resolvedEditLink?.pattern

  const showLastUpdated =
    pageData?.frontmatter.lastUpdated !== false &&
    resolvedLastUpdated?.enabled &&
    pageData?.lastUpdated

  const editHref = showEditLink
    ? resolvedEditLink.pattern.replace(":path", pageData?.relativePath || "")
    : null

  const lastUpdatedText = showLastUpdated
    ? new Date(pageData.lastUpdated!).toLocaleDateString(
        undefined,
        resolvedLastUpdated?.formatOptions ?? {
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
                href={editHref!}
                target="_blank"
                rel="noopener noreferrer"
                className={footerStyles.editLink}
              >
                {resolvedEditLink?.text ?? "Edit this page"}
              </a>
            )}
            {showLastUpdated && (
              <span>
                {resolvedLastUpdated?.text ?? "Last updated"}: {lastUpdatedText}
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
