import { Children, isValidElement, useState } from "react"

import * as styles from "./CodeBlock.css"
import { ArdoCopyButton } from "./CopyButton"

const EMPTY_HIGHLIGHT_LINES: number[] = []

/**
 * Strips leading/trailing blank lines and removes common leading whitespace
 * so that template literals in indented JSX render cleanly.
 */
function outdent(text: string): string {
  let start = 0
  while (start < text.length && text[start] === "\n") {
    start++
  }

  let end = text.length
  while (
    end > start &&
    (text[end - 1] === "\n" ||
      text[end - 1] === "\r" ||
      text[end - 1] === "\t" ||
      text[end - 1] === " ")
  ) {
    end--
  }

  const trimmed = text.slice(start, end)
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

function CodeBlockContent({
  html,
  hasHtml,
  hasCustomChildren,
  language,
  lines,
  highlightLines,
  lineNumbers,
  children,
}: {
  html?: string
  hasHtml: boolean
  hasCustomChildren: boolean
  language: string
  lines: string[]
  highlightLines: number[]
  lineNumbers: boolean
  children?: React.ReactNode
}) {
  if (hasHtml) return <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  if (hasCustomChildren) return <>{children}</>
  return (
    <pre className={`language-${language}`}>
      <code>
        {lines.map((line, index) => {
          const lineNum = index + 1
          const cls = highlightLines.includes(lineNum)
            ? `${styles.codeLine} highlighted`
            : styles.codeLine
          return (
            <span key={`${lineNum}-${line}`} className={cls}>
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
  highlightLines = EMPTY_HIGHLIGHT_LINES,
  children,
  __html,
}: ArdoCodeBlockProps) {
  const code = codeProp ?? (typeof children === "string" ? outdent(children) : "")
  const hasCustomChildren = children != null && typeof children !== "string"
  const hasHtml = (__html ?? "") !== ""
  const hasTitle = (title ?? "") !== ""
  const lines = code.split("\n")

  return (
    <div className={styles.codeBlock} data-lang={language}>
      {hasTitle && <div className={styles.codeTitle}>{title}</div>}
      <div className={styles.codeWrapper}>
        <CodeBlockContent
          html={__html}
          hasHtml={hasHtml}
          hasCustomChildren={hasCustomChildren}
          language={language}
          lines={lines}
          highlightLines={highlightLines}
          lineNumbers={lineNumbers}
        >
          {children}
        </CodeBlockContent>
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
  const hasLabels = (labelsStr ?? "") !== ""

  // Filter to only valid React elements (skip whitespace text nodes)
  const childArray = Children.toArray(children).filter((child) => isValidElement(child))
  const labelArray = hasLabels ? (labelsStr ?? "").split(",") : []
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
            type="button"
            key={tab}
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
            key={tabAt(tabs, index)}
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

function tabAt(tabs: string[], index: number): string {
  return tabs[index]
}
