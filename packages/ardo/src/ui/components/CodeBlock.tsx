import { useState, Children, isValidElement } from "react"
import { CopyButton } from "./CopyButton"

export interface CodeBlockProps {
  /** The code to display */
  code: string
  /** Programming language for syntax highlighting */
  language?: string
  /** Optional title shown above the code */
  title?: string
  /** Show line numbers */
  lineNumbers?: boolean
  /** Line numbers to highlight */
  highlightLines?: number[]
  /** Optional custom content to render instead of the code */
  children?: React.ReactNode
}

/**
 * Syntax-highlighted code block with copy button.
 */
export function CodeBlock({
  code,
  language = "text",
  title,
  lineNumbers = false,
  highlightLines = [],
  children,
}: CodeBlockProps) {
  const lines = code.split("\n")

  return (
    <div className="ardo-code-block" data-lang={language}>
      {title && <div className="ardo-code-title">{title}</div>}
      <div className="ardo-code-wrapper">
        {children || (
          <pre className={`language-${language}`}>
            <code>
              {lines.map((line, index) => {
                const lineNum = index + 1
                const isHighlighted = highlightLines.includes(lineNum)
                const classes = ["ardo-code-line"]
                if (isHighlighted) classes.push("highlighted")

                return (
                  <span key={index} className={classes.join(" ")}>
                    {lineNumbers && <span className="ardo-line-number">{lineNum}</span>}
                    <span className="ardo-line-content">{line}</span>
                    {index < lines.length - 1 && "\n"}
                  </span>
                )
              })}
            </code>
          </pre>
        )}
        <CopyButton code={code} />
      </div>
    </div>
  )
}

export interface CodeGroupProps {
  /** CodeBlock components to display as tabs */
  children: React.ReactNode
  /** Comma-separated tab labels (set by remarkContainersMdx from code block meta) */
  labels?: string
}

/**
 * Tabbed group of code blocks.
 * Labels come from the `labels` prop (set at remark level) or fall back to
 * data-label / title / language props on children.
 */
export function CodeGroup({ children, labels: labelsStr }: CodeGroupProps) {
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
    <div className="ardo-code-group">
      <div className="ardo-code-group-tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={["ardo-code-group-tab", index === activeTab && "active"]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="ardo-code-group-panels">
        {childArray.map((child, index) => (
          <div
            key={index}
            className={["ardo-code-group-panel", index === activeTab && "active"]
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
