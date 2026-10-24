import { Children, Fragment, isValidElement, type ReactNode } from "react"
import { ArdoLink } from "../runtime/page"
import { useArdoPath } from "../runtime/page-context"

import { useArdoLabels, useArdoPageData, useArdoSidebar, useArdoSiteConfig } from "../runtime/hooks"
import { useArdoLocale } from "../runtime/locale"
import { getPrevNextLinks } from "../runtime/sidebar-utils"
import { useBareContent } from "./BareContent"
import { ArdoBreadcrumb } from "./Breadcrumb"
import { ChromeIcon } from "./chrome-icons"
import { ardoContent } from "./content.css"
import * as docStyles from "./DocPage.css"
import * as footerStyles from "./Footer.css"
import { getNodeText } from "./text-content"
import { ArdoVersionBanner } from "./site-controls"

export type ArdoContentProps = {
  children: ReactNode
  /** Edit link configuration (overrides ArdoSiteConfig) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (overrides ArdoSiteConfig) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  /** Where to render edit/updated metadata (default: footer) */
  metaPlacement?: "footer" | "footer-on-narrow" | "none"
  /** Optional in-page navigation, displayed after the article heading. */
  outline?: ReactNode
  /** Replace the article heading; false omits it. Undefined keeps the default. */
  header?: ReactNode
  /** Replace edit/updated metadata and previous/next links; false omits them. */
  footer?: ReactNode
}

type ContentMetaInput = {
  pageData: ReturnType<typeof useArdoPageData>
  editLink: ArdoContentProps["editLink"]
  lastUpdated: ArdoContentProps["lastUpdated"]
  siteConfig: ReturnType<typeof useArdoSiteConfig>
  locale: string
  labels: ReturnType<typeof useArdoLabels>
}

function resolveEditLink(input: ContentMetaInput) {
  const resolved = input.editLink ?? input.siteConfig.editLink
  const pattern = resolved?.pattern ?? ""
  const relativePath = input.pageData?.relativePath ?? ""
  const show =
    input.pageData?.frontmatter.editLink !== false && pattern !== "" && relativePath !== ""
  return {
    href: show
      ? pattern.replace(
          ":path",
          relativePath
            .split("/")
            .map((part) => encodeURIComponent(part))
            .join("/")
        )
      : undefined,
    text: resolved?.text ?? input.labels.page.edit,
    show,
  }
}

function resolveLastUpdated(input: ContentMetaInput) {
  const resolved = input.lastUpdated ?? input.siteConfig.lastUpdated
  const value = input.pageData?.lastUpdated
  const show =
    input.pageData?.frontmatter.lastUpdated !== false &&
    resolved?.enabled === true &&
    typeof value === "number" &&
    Number.isFinite(value)
  const formatOptions = {
    timeZone: "UTC",
    ...(resolved?.formatOptions ?? {
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
    }),
  }
  return {
    label: resolved?.text ?? input.labels.page.lastUpdated,
    text: show ? new Date(value).toLocaleDateString(input.locale, formatOptions) : undefined,
    show,
  }
}

/**
 * The article of a documentation page: title, lede, the page content, edit link, last-updated
 * date, and previous and next links.
 */
export function ArdoContent({
  children,
  editLink,
  lastUpdated,
  metaPlacement = "footer",
  outline,
  header,
  footer,
}: ArdoContentProps) {
  const isBare = useBareContent()
  const pageData = useArdoPageData()
  const siteConfig = useArdoSiteConfig()
  const locale = useArdoLocale()
  const labels = useArdoLabels()
  const sidebar = useArdoSidebar()
  const pathname = useArdoPath()

  if (isBare) {
    return (
      <div className={`ardo-content-body ${docStyles.contentBody} ${ardoContent}`}>{children}</div>
    )
  }

  const input: ContentMetaInput = { pageData, editLink, lastUpdated, siteConfig, locale, labels }
  const edit = resolveEditLink(input)
  const updated = resolveLastUpdated(input)
  const { prev, next } = getPrevNextLinks(sidebar, pathname)

  return (
    <article className={`ardo-content ${docStyles.contentContainer}`}>
      <ArdoVersionBanner />
      <ArdoBreadcrumb />
      {header === undefined ? (
        <ContentHeader
          title={pageData?.frontmatter.title ?? ""}
          description={pageData?.frontmatter.description ?? ""}
          showDescription={shouldShowDescription(
            pageData?.frontmatter.description ?? "",
            pageData?.frontmatter.lede,
            children
          )}
        />
      ) : (
        header
      )}
      {outline}
      <div className={`ardo-content-body ${docStyles.contentBody} ${ardoContent}`}>{children}</div>
      {footer === undefined ? (
        <>
          {metaPlacement !== "none" && (
            <ContentMeta
              edit={edit}
              updated={updated}
              className={
                metaPlacement === "footer-on-narrow" ? docStyles.narrowPageMeta : undefined
              }
            />
          )}
          <ContentPrevNext prev={prev} next={next} />
        </>
      ) : (
        footer
      )}
    </article>
  )
}

function ContentHeader({
  description,
  showDescription,
  title,
}: {
  description: string
  showDescription: boolean
  title: string
}) {
  if (title === "") return null
  return (
    <header className={`ardo-content-header ${docStyles.contentHeader}`}>
      <h1 className={`ardo-content-title ${docStyles.contentTitle}`}>{title}</h1>
      {showDescription && (
        <p className={`ardo-content-description ${docStyles.contentDescription}`}>{description}</p>
      )}
    </header>
  )
}

function shouldShowDescription(description: string, lede: unknown, children: ReactNode): boolean {
  if (description === "" || lede === false) return false

  const firstParagraphText = getFirstParagraphText(children)
  if (firstParagraphText == null) return true

  return normalizeText(firstParagraphText) !== normalizeText(description)
}

function getFirstParagraphText(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    const result = readFirstParagraphCandidate(child)
    if (result.action === "continue") {
      continue
    }
    return result.text
  }

  return undefined
}

type ParagraphCandidate = { action: "continue" } | { action: "return"; text: string | undefined }

function readFirstParagraphCandidate(child: ReactNode): ParagraphCandidate {
  if (!isValidElement<{ children?: ReactNode }>(child)) {
    return typeof child === "string" && child.trim() === ""
      ? { action: "continue" }
      : { action: "return", text: undefined }
  }

  if (child.type === Fragment) {
    const nested = getFirstParagraphText(child.props.children)
    return nested == null ? { action: "continue" } : { action: "return", text: nested }
  }

  if (child.type !== "p") {
    return { action: "return", text: undefined }
  }

  return { action: "return", text: getNodeText(child.props.children) }
}

function normalizeText(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim()
}

function ContentMeta({
  edit,
  updated,
  className,
}: {
  edit: ReturnType<typeof resolveEditLink>
  updated: ReturnType<typeof resolveLastUpdated>
  className?: string
}) {
  if (!edit.show && !updated.show) return null
  return (
    <div className={[footerStyles.contentMeta, className].filter(Boolean).join(" ")}>
      {edit.show && (
        <a
          href={edit.href}
          target="_blank"
          rel="noopener noreferrer"
          className={footerStyles.editLink}
        >
          <ChromeIcon name="edit" />
          {edit.text}
          <ChromeIcon name="external-link" size={12} />
        </a>
      )}
      {updated.show && (
        <span className={footerStyles.updatedText}>
          <ChromeIcon name="last-updated" />
          {updated.label}: {updated.text}
        </span>
      )}
    </div>
  )
}

function ContentPrevNext({
  prev,
  next,
}: {
  prev: ReturnType<typeof getPrevNextLinks>["prev"]
  next: ReturnType<typeof getPrevNextLinks>["next"]
}) {
  const labels = useArdoLabels()
  const prevLink = prev?.link ?? ""
  const nextLink = next?.link ?? ""
  const hasPrev = prevLink !== ""
  const hasNext = nextLink !== ""
  if (!hasPrev && !hasNext) return null

  return (
    <nav className={footerStyles.prevNext} aria-label={labels.page.navigation}>
      {hasPrev ? (
        <ArdoLink to={prevLink} className={footerStyles.prevLink}>
          <span className={footerStyles.prevNextLabel}>
            <ChromeIcon name="previous-next" className={footerStyles.previousArrow} />
            {labels.page.previous}
          </span>
          <span className={footerStyles.prevNextTitle}>{prev?.text}</span>
        </ArdoLink>
      ) : (
        <div />
      )}
      {hasNext ? (
        <ArdoLink to={nextLink} className={footerStyles.nextLink}>
          <span className={`${footerStyles.prevNextLabel} ${footerStyles.nextLabel}`}>
            {labels.page.next}
            <ChromeIcon name="previous-next" />
          </span>
          <span className={footerStyles.prevNextTitle}>{next?.text}</span>
        </ArdoLink>
      ) : (
        <div />
      )}
    </nav>
  )
}
