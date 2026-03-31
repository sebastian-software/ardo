import type { MDXComponents } from "mdx/types"
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react"

import { Link } from "react-router"

import { ArdoCodeBlock, ArdoCodeGroup } from "../ui/components/CodeBlock"
import * as codeStyles from "../ui/components/CodeBlock.css"
import { ArdoDanger, ArdoInfo, ArdoNote, ArdoTip, ArdoWarning } from "../ui/components/Container"
import { ArdoCopyButton } from "../ui/components/CopyButton"
import { ArdoIcon } from "../ui/components/Icon"
import { ArdoSteps } from "../ui/components/Steps"
import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "../ui/components/Tabs"
import { ArdoContent } from "../ui/Content"

/**
 * Smart link component that uses React Router for internal links
 * and regular anchor tags for external links.
 */
function SmartLink({
  href,
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const hrefValue = href ?? ""
  const hasHref = hrefValue !== ""
  const isExternal = hrefValue.startsWith("http") || hrefValue.startsWith("//")
  const isAnchor = hrefValue.startsWith("#")

  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }

  if (isAnchor || !hasHref) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    )
  }

  // Internal link - use React Router Link for proper basename handling
  return (
    <Link to={hrefValue} className={className} {...props}>
      {children}
    </Link>
  )
}

/**
 * Extracts text content from React children (for copy button)
 */
function extractTextContent(children: ReactNode): string {
  if (typeof children === "string") {
    return children
  }
  if (Array.isArray(children)) {
    return children.map((child: ReactNode) => extractTextContent(child)).join("")
  }
  if (children != null && typeof children === "object" && "props" in children) {
    const nestedChildren = (children as { props: { children?: ReactNode } }).props.children
    if (nestedChildren != null) {
      return extractTextContent(nestedChildren)
    }
  }
  return ""
}

/**
 * Code block wrapper with copy button and optional title.
 * Forwards data-label for CodeGroup tab labels.
 */
function PreBlock({
  children,
  "data-title": dataTitle,
  "data-label": dataLabel,
  ...props
}: { "data-title"?: string; "data-label"?: string } & HTMLAttributes<HTMLPreElement>) {
  const code = extractTextContent(children)
  const hasDataTitle = dataTitle != null && dataTitle !== ""

  return (
    <div className={codeStyles.codeBlock} data-label={dataLabel}>
      {hasDataTitle && <div className={codeStyles.codeTitle}>{dataTitle}</div>}
      <div className={codeStyles.codeWrapper}>
        <pre {...props}>{children}</pre>
        <ArdoCopyButton code={code} />
      </div>
    </div>
  )
}

/**
 * Provides MDX components for rendering documentation content.
 * Used as the providerImportSource for `@mdx-js/rollup`.
 */
export function useMDXComponents(): MDXComponents {
  return {
    // Wrapper for the entire MDX content - uses ArdoContent for styling
    wrapper: ({ children }: { children: ReactNode }) => <ArdoContent>{children}</ArdoContent>,

    // MDX element overrides — styled via tag selectors in content.css.ts
    a: SmartLink,
    pre: PreBlock,

    // Custom Ardo components available in MDX (mapped as short names)
    Icon: ArdoIcon,
    Tip: ArdoTip,
    Warning: ArdoWarning,
    Danger: ArdoDanger,
    Info: ArdoInfo,
    Note: ArdoNote,
    Steps: ArdoSteps,
    Tabs: ArdoTabs,
    TabList: ArdoTabList,
    Tab: ArdoTab,
    TabPanel: ArdoTabPanel,
    TabPanels: ArdoTabPanels,
    CodeBlock: ArdoCodeBlock,
    CodeGroup: ArdoCodeGroup,
  }
}
