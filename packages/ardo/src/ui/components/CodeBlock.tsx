import { useState } from "react"
import { CopyButton } from "./CopyButton"

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  lineNumbers?: boolean
  highlightLines?: number[]
  children?: React.ReactNode
}

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

interface CodeGroupProps {
  children: React.ReactNode
}

export function CodeGroup({ children }: CodeGroupProps) {
  const [activeTab, setActiveTab] = useState(0)

  const childArray = Array.isArray(children) ? children : [children]
  const tabs = childArray.map((child, index) => {
    const props = (child as React.ReactElement)?.props as { title?: string; language?: string }
    return props?.title || props?.language || `Tab ${index + 1}`
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
