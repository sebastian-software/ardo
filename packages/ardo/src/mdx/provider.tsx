import type { MDXComponents } from "mdx/types"
import type {
  ReactNode,
  HTMLAttributes,
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react"
import { Content } from "../ui/Content"
import { CopyButton } from "../ui/components/CopyButton"
import { Icon } from "../ui/components/Icon"
import { Tip, Warning, Danger, Info, Note } from "../ui/components/Container"
import { Tabs, TabList, Tab, TabPanel, TabPanels } from "../ui/components/Tabs"
import { CodeBlock, CodeGroup } from "../ui/components/CodeBlock"

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
 * Code block wrapper with copy button
 */
function PreBlock({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  const code = extractTextContent(children)

  return (
    <div className="ardo-code-block">
      <div className="ardo-code-wrapper">
        <pre {...props}>{children}</pre>
        <CopyButton code={code} />
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
    // Wrapper for the entire MDX content - uses Content for styling
    wrapper: ({ children }: { children: ReactNode }) => <Content>{children}</Content>,

    // Custom components for markdown elements with ardo- prefix
    h1: (props: HTMLAttributes<HTMLHeadingElement>) => <h1 className="ardo-heading-1" {...props} />,
    h2: (props: HTMLAttributes<HTMLHeadingElement>) => <h2 className="ardo-heading-2" {...props} />,
    h3: (props: HTMLAttributes<HTMLHeadingElement>) => <h3 className="ardo-heading-3" {...props} />,
    h4: (props: HTMLAttributes<HTMLHeadingElement>) => <h4 className="ardo-heading-4" {...props} />,
    h5: (props: HTMLAttributes<HTMLHeadingElement>) => <h5 className="ardo-heading-5" {...props} />,
    h6: (props: HTMLAttributes<HTMLHeadingElement>) => <h6 className="ardo-heading-6" {...props} />,
    p: (props: HTMLAttributes<HTMLParagraphElement>) => <p className="ardo-paragraph" {...props} />,
    a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="ardo-link" {...props} />,
    ul: (props: HTMLAttributes<HTMLUListElement>) => (
      <ul className="ardo-list ardo-list-unordered" {...props} />
    ),
    ol: (props: HTMLAttributes<HTMLOListElement>) => (
      <ol className="ardo-list ardo-list-ordered" {...props} />
    ),
    li: (props: HTMLAttributes<HTMLLIElement>) => <li className="ardo-list-item" {...props} />,
    blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="ardo-blockquote" {...props} />
    ),
    pre: PreBlock,
    code: (props: HTMLAttributes<HTMLElement>) => <code className="ardo-code" {...props} />,
    table: (props: TableHTMLAttributes<HTMLTableElement>) => (
      <table className="ardo-table" {...props} />
    ),
    thead: (props: HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="ardo-table-head" {...props} />
    ),
    tbody: (props: HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody className="ardo-table-body" {...props} />
    ),
    tr: (props: HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="ardo-table-row" {...props} />
    ),
    th: (props: ThHTMLAttributes<HTMLTableCellElement>) => (
      <th className="ardo-table-header" {...props} />
    ),
    td: (props: TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="ardo-table-cell" {...props} />
    ),
    hr: (props: HTMLAttributes<HTMLHRElement>) => <hr className="ardo-divider" {...props} />,
    img: (props: ImgHTMLAttributes<HTMLImageElement>) => <img className="ardo-image" {...props} />,

    // Custom Ardo components available in MDX
    Icon,
    Tip,
    Warning,
    Danger,
    Info,
    Note,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    TabPanels,
    CodeBlock,
    CodeGroup,
  }
}
