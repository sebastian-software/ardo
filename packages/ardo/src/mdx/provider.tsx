import { type AnchorHTMLAttributes, type ReactNode, use } from "react"

import { ArdoMDXComponentsContext, type ArdoMDXComponents } from "./components-context"

import { ArdoLink } from "../runtime/page"

import { ArdoAccordion, ArdoAccordionGroup } from "../ui/components/Accordion"
import { ArdoBadge } from "../ui/components/Badge"
import { ArdoCard, ArdoCardGroup } from "../ui/components/Card"
import { ArdoCodeBlock, ArdoCodeGroup } from "../ui/components/CodeBlock"
import { ArdoDanger, ArdoInfo, ArdoNote, ArdoTip, ArdoWarning } from "../ui/components/Container"
import { ArdoContentTable } from "../ui/components/ContentTable"
import { ArdoIcon } from "../ui/components/Icon"
import { ArdoSteps } from "../ui/components/Steps"
import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "../ui/components/Tabs"
import { ArdoDocContent } from "../ui/DocPage"

/**
 * Apply Ardo's deployment base to internal links and use regular anchors
 * for external links.
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

  // Internal link: ArdoLink applies the site's base path
  return (
    <ArdoLink to={hrefValue} className={className} {...props}>
      {children}
    </ArdoLink>
  )
}

/**
 * Provides MDX components for rendering documentation content.
 * Used by generated Ferromark route modules to resolve Markdown components.
 */
export type { ArdoMDXComponents } from "./components-context"

export function useMDXComponents(): ArdoMDXComponents {
  return {
    // Wrapper for the entire MDX content - renders content + TOC via DocContent.
    // Generated route modules wrap this with ArdoPageDataProvider, which makes
    // frontmatter and the outline available throughout the page content.
    wrapper: ({ children }: { children: ReactNode }) => <ArdoDocContent>{children}</ArdoDocContent>,

    // MDX element overrides — styled via tag selectors in content.css.ts
    a: SmartLink,
    table: ArdoContentTable,

    // Custom Ardo components available in MDX (mapped as short names)
    Accordion: ArdoAccordion,
    AccordionGroup: ArdoAccordionGroup,
    Badge: ArdoBadge,
    Card: ArdoCard,
    CardGroup: ArdoCardGroup,
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
    ...use(ArdoMDXComponentsContext),
  }
}
