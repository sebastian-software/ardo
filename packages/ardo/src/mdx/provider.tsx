import type { MDXComponents } from "mdx/types"
import type { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from "react"
import { Link } from "react-router"
import { ArdoContent } from "../ui/Content"
import { ArdoCopyButton } from "../ui/components/CopyButton"
import * as codeStyles from "../ui/components/CodeBlock.css"
import { ArdoIcon } from "../ui/components/Icon"
import { ArdoTip, ArdoWarning, ArdoDanger, ArdoInfo, ArdoNote } from "../ui/components/Container"
import { ArdoTabs, ArdoTabList, ArdoTab, ArdoTabPanel, ArdoTabPanels } from "../ui/components/Tabs"
import { ArdoCodeBlock, ArdoCodeGroup } from "../ui/components/CodeBlock"

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
  const isExternal = href?.startsWith("http") || href?.startsWith("//")
  const isAnchor = href?.startsWith("#")

  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }

  if (isAnchor || !href) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    )
  }

  // Internal link - use React Router Link for proper basename handling
  return (
    <Link to={href} className={className} {...props}>
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
    return children.map(extractTextContent).join("")
  }
  if (children && typeof children === "object" && "props" in children) {
    return extractTextContent((children as { props: { children?: ReactNode } }).props.children)
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
}: HTMLAttributes<HTMLPreElement> & { "data-title"?: string; "data-label"?: string }) {
  const code = extractTextContent(children)

  return (
    <div className={codeStyles.codeBlock} data-label={dataLabel}>
      {dataTitle && <div className={codeStyles.codeTitle}>{dataTitle}</div>}
      <div className={codeStyles.codeWrapper}>
        <pre {...props}>{children}</pre>
        <ArdoCopyButton code={code} />
      </div>
    </div>
  )
}

/**
 * Provides MDX components for rendering documentation content.
 * Used as the providerImportSource for @mdx-js/rollup.
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
    Tabs: ArdoTabs,
    TabList: ArdoTabList,
    Tab: ArdoTab,
    TabPanel: ArdoTabPanel,
    TabPanels: ArdoTabPanels,
    CodeBlock: ArdoCodeBlock,
    CodeGroup: ArdoCodeGroup,
  }
}
