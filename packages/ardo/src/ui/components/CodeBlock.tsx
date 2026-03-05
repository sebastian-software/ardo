import { Children, isValidElement, useState } from "react"

import * as styles from "./CodeBlock.css"
import { ArdoCopyButton } from "./CopyButton"

/**
 * Strips leading/trailing blank lines and removes common leading whitespace
 * so that template literals in indented JSX render cleanly.
 */
function outdent(text: string): string {
  // Remove leading/trailing blank lines
  const trimmed = text.replace(/^\n+/, "").replace(/\n\s*$/, "")
  const lines = trimmed.split("\n")

  // Find minimum indentation (ignoring empty lines)
  const indent = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min
    const match = /^(\s*)/.exec(line)
    return match ? Math.min(min, match[1].length) : min
  }, Infinity)

  if (indent === 0 || indent === Infinity) return trimmed
  return lines.map((line) => line.slice(indent)).join("\n")
}

export interface ArdoCodeBlockProps {
  /** The code to display (as prop or as children string) */
  code?: string
  /** Programming language for syntax highlighting */
  language?: string
  /** Optional title shown above the code */
  title?: string
  /** Show line numbers */
  lineNumbers?: boolean
  /** Line numbers to highlight */
  highlightLines?: number[]
  /** Code as children — supports template literals with auto-outdent */
  children?: React.ReactNode
  /** Pre-rendered Shiki HTML (injected by ardo:codeblock-highlight plugin) */
  __html?: string
}

/**
 * Syntax-highlighted code block with copy button.
 *
 * Code can be provided via the `code` prop or as children:
 * ```tsx
 * <CodeBlock language="typescript">{`
 *   const x = 42
 * `}</CodeBlock>
 * ```tsx
 * When children is a string, leading/trailing blank lines and common
 * indentation are stripped automatically.
 */
export function ArdoCodeBlock({
  code: codeProp,
  language = "text",
  title,
  lineNumbers = false,
  highlightLines = [],
  children,
  __html,
}: ArdoCodeBlockProps) {
  const code = codeProp ?? (typeof children === "string" ? outdent(children) : "")
  const hasCustomChildren = children != null && typeof children !== "string"
  const lines = code.split("\n")

  let content: React.ReactNode
  if (__html) {
    content = <div dangerouslySetInnerHTML={{ __html }} />
  } else if (hasCustomChildren) {
    content = <>{children}</>
  } else {
    content = (
      <pre className={`language-${language}`}>
        <code>
          {lines.map((line, index) => {
            const lineNum = index + 1
            const isHighlighted = highlightLines.includes(lineNum)
            const classes = [styles.codeLine]
            if (isHighlighted) classes.push("highlighted")

            return (
              <span key={index} className={classes.join(" ")}>
                {lineNumbers && <span className={styles.lineNumber}>{lineNum}</span>}
                <span>{line}</span>
                {index < lines.length - 1 && "\n"}
              </span>
            )
          })}
        </code>
      </pre>
    )
  }

  return (
    <div className={styles.codeBlock} data-lang={language}>
      {title && <div className={styles.codeTitle}>{title}</div>}
      <div className={styles.codeWrapper}>
        {content}
        <ArdoCopyButton code={code} />
      </div>
    </div>
  )
}

export interface ArdoCodeGroupProps {
  /** CodeBlock components to display as tabs */
  children: React.ReactNode
  /** Comma-separated tab labels */
  labels?: string
}

/**
 * Tabbed group of code blocks.
 * Labels come from the `labels` prop (set at remark level) or fall back to
 * data-label / title / language props on children.
 */
export function ArdoCodeGroup({ children, labels: labelsStr }: ArdoCodeGroupProps) {
  const [activeTab, setActiveTab] = useState(0)

  // Filter to only valid React elements (skip whitespace text nodes)
  const childArray = Children.toArray(children).filter(isValidElement)
  const labelArray = labelsStr ? labelsStr.split(",") : []
  const tabs = childArray.map((child, index) => {
    if (labelArray[index]) return labelArray[index]
    const props = child.props as Record<string, unknown>
    return (
      (props["data-label"] as string) ||
      (props.title as string) ||
      (props.language as string) ||
      `Tab ${index + 1}`
    )
  })

  return (
    <div className={styles.codeGroup}>
      <div className={styles.codeGroupTabs}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={[styles.codeGroupTab, index === activeTab && "active"]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              setActiveTab(index)
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.codeGroupPanels}>
        {childArray.map((child, index) => (
          <div
            key={index}
            className={[styles.codeGroupPanel, index === activeTab && "active"]
              .filter(Boolean)
              .join(" ")}
            style={{ display: index === activeTab ? "block" : "none" }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
