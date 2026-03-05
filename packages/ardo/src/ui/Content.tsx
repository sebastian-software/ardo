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
  const editPattern = resolvedEditLink?.pattern ?? ""
  const hasEditPattern = editPattern !== ""
  const pageRelativePath = pageData?.relativePath ?? ""
  const hasPageData = pageData !== undefined
  const showEditLink = pageData?.frontmatter.editLink !== false && hasEditPattern && hasPageData

  const lastUpdatedValue = pageData?.lastUpdated
  const hasLastUpdatedValue = typeof lastUpdatedValue === "number"
  const lastUpdatedEnabled = resolvedLastUpdated?.enabled === true
  const showLastUpdated =
    pageData?.frontmatter.lastUpdated !== false && lastUpdatedEnabled && hasLastUpdatedValue

  const lastUpdatedFormatOptions = resolvedLastUpdated?.formatOptions ?? {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  const lastUpdatedLabel = resolvedLastUpdated?.text ?? "Last updated"
  const editHref = showEditLink ? editPattern.replace(":path", pageRelativePath) : undefined
  const lastUpdatedText = showLastUpdated
    ? new Date(lastUpdatedValue).toLocaleDateString(undefined, lastUpdatedFormatOptions)
    : undefined
  const pageTitle = pageData?.frontmatter.title ?? ""
  const pageDescription = pageData?.frontmatter.description ?? ""
  const hasPageTitle = pageTitle !== ""
  const hasPageDescription = pageDescription !== ""
  const showMeta = showEditLink || showLastUpdated
  const prevLink = prev?.link ?? ""
  const nextLink = next?.link ?? ""
  const prevText = prev?.text ?? ""
  const nextText = next?.text ?? ""
  const hasPrev = prev !== undefined && prevLink !== ""
  const hasNext = next !== undefined && nextLink !== ""
  const showPrevNext = hasPrev || hasNext

  return (
    <article className={docStyles.contentContainer}>
      {hasPageTitle && (
        <header className={docStyles.contentHeader}>
          <h1 className={docStyles.contentTitle}>{pageTitle}</h1>
          {hasPageDescription && <p className={docStyles.contentDescription}>{pageDescription}</p>}
        </header>
      )}

      <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>

      <footer className={footerStyles.contentFooter}>
        {showMeta && (
          <div className={footerStyles.contentMeta}>
            {showEditLink && (
              <a
                href={editHref}
                target="_blank"
                rel="noopener noreferrer"
                className={footerStyles.editLink}
              >
                {resolvedEditLink?.text ?? "Edit this page"}
              </a>
            )}
            {showLastUpdated && (
              <span>
                {lastUpdatedLabel}: {lastUpdatedText}
              </span>
            )}
          </div>
        )}

        {showPrevNext && (
          <nav className={footerStyles.prevNext} aria-label="Page navigation">
            {hasPrev ? (
              <Link to={prevLink} className={footerStyles.prevLink}>
                <span className={footerStyles.prevNextLabel}>Previous</span>
                <span className={footerStyles.prevNextTitle}>{prevText}</span>
              </Link>
            ) : (
              <div />
            )}
            {hasNext ? (
              <Link to={nextLink} className={footerStyles.nextLink}>
                <span className={footerStyles.prevNextLabel}>Next</span>
                <span className={footerStyles.prevNextTitle}>{nextText}</span>
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
