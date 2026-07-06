import { Children, Fragment, isValidElement, type ReactNode } from "react"
import { Link, useLocation } from "react-router"

import { useArdoPageData, useArdoSidebar, useArdoSiteConfig } from "../runtime/hooks"
import { getPrevNextLinks } from "../runtime/sidebar-utils"
import { useBareContent } from "./BareContent"
import { ArdoBreadcrumb } from "./Breadcrumb"
import { ardoContent } from "./content.css"
import * as docStyles from "./DocPage.css"
import * as footerStyles from "./Footer.css"

type ContentProps = {
  children: ReactNode
  /** Edit link configuration (overrides ArdoSiteConfig) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (overrides ArdoSiteConfig) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  /** Where to render edit/updated metadata (default: footer) */
  metaPlacement?: "footer" | "none"
}

type ContentMetaInput = {
  pageData: ReturnType<typeof useArdoPageData>
  editLink: ContentProps["editLink"]
  lastUpdated: ContentProps["lastUpdated"]
  siteConfig: ReturnType<typeof useArdoSiteConfig>
}

function resolveEditLink(input: ContentMetaInput) {
  const resolved = input.editLink ?? input.siteConfig.editLink
  const pattern = resolved?.pattern ?? ""
  const relativePath = input.pageData?.relativePath ?? ""
  const show =
    input.pageData?.frontmatter.editLink !== false && pattern !== "" && input.pageData !== undefined
  return {
    href: show ? pattern.replace(":path", relativePath) : undefined,
    text: resolved?.text ?? "Edit this page",
    show,
  }
}

function resolveLastUpdated(input: ContentMetaInput) {
  const resolved = input.lastUpdated ?? input.siteConfig.lastUpdated
  const value = input.pageData?.lastUpdated
  const show =
    input.pageData?.frontmatter.lastUpdated !== false &&
    resolved?.enabled === true &&
    typeof value === "number"
  const formatOptions = resolved?.formatOptions ?? {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  }
  return {
    label: resolved?.text ?? "Last updated",
    text: show ? new Date(value).toLocaleDateString(undefined, formatOptions) : undefined,
    show,
  }
}

export function ArdoContent({
  children,
  editLink,
  lastUpdated,
  metaPlacement = "footer",
}: ContentProps) {
  const isBare = useBareContent()
  const pageData = useArdoPageData()
  const siteConfig = useArdoSiteConfig()
  const sidebar = useArdoSidebar()
  const location = useLocation()

  if (isBare) {
    return <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>
  }

  const input: ContentMetaInput = { pageData, editLink, lastUpdated, siteConfig }
  const edit = resolveEditLink(input)
  const updated = resolveLastUpdated(input)
  const { prev, next } = getPrevNextLinks(sidebar, location.pathname)

  return (
    <article className={docStyles.contentContainer}>
      <ArdoBreadcrumb />
      <ContentHeader
        title={pageData?.frontmatter.title ?? ""}
        description={pageData?.frontmatter.description ?? ""}
        showDescription={shouldShowDescription(
          pageData?.frontmatter.description ?? "",
          pageData?.frontmatter.lede,
          children
        )}
      />
      <div className={`${docStyles.contentBody} ${ardoContent}`}>{children}</div>
      {metaPlacement === "footer" && <ContentMeta edit={edit} updated={updated} />}
      <ContentPrevNext prev={prev} next={next} />
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
    <header className={docStyles.contentHeader}>
      <h1 className={docStyles.contentTitle}>{title}</h1>
      {showDescription && <p className={docStyles.contentDescription}>{description}</p>}
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

function getNodeText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return getNodeText(child.props.children)
      }

      return ""
    })
    .join("")
}

function normalizeText(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim()
}

function ContentMeta({
  edit,
  updated,
}: {
  edit: ReturnType<typeof resolveEditLink>
  updated: ReturnType<typeof resolveLastUpdated>
}) {
  if (!edit.show && !updated.show) return null
  return (
    <div className={footerStyles.contentMeta}>
      {edit.show && (
        <a
          href={edit.href}
          target="_blank"
          rel="noopener noreferrer"
          className={footerStyles.editLink}
        >
          {edit.text}
        </a>
      )}
      {updated.show && (
        <span>
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
  const prevLink = prev?.link ?? ""
  const nextLink = next?.link ?? ""
  const hasPrev = prevLink !== ""
  const hasNext = nextLink !== ""
  if (!hasPrev && !hasNext) return null

  return (
    <nav className={footerStyles.prevNext} aria-label="Page navigation">
      {hasPrev ? (
        <Link to={prevLink} className={footerStyles.prevLink}>
          <span className={footerStyles.prevNextLabel}>Previous</span>
          <span className={footerStyles.prevNextTitle}>{prev?.text}</span>
        </Link>
      ) : (
        <div />
      )}
      {hasNext ? (
        <Link to={nextLink} className={footerStyles.nextLink}>
          <span className={footerStyles.prevNextLabel}>Next</span>
          <span className={footerStyles.prevNextTitle}>{next?.text}</span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
