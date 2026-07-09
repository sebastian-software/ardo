import { useEffect, useId, useState, useSyncExternalStore } from "react"

import * as styles from "./Mermaid.css"

export type ArdoMermaidProps = {
  /** Mermaid diagram source. */
  code: string
  /** Additional CSS class. */
  className?: string
}

type RenderState =
  | { status: "error"; message: string }
  | { status: "pending" }
  | { status: "rendered"; svg: string }

function subscribeToThemeClass(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => {
    observer.disconnect()
  }
}

function readIsDark(): boolean {
  return document.documentElement.classList.contains("dark")
}

function readIsDarkServer(): boolean {
  return false
}

function useDocumentThemeIsDark(): boolean {
  return useSyncExternalStore(subscribeToThemeClass, readIsDark, readIsDarkServer)
}

/**
 * Renders a Mermaid diagram from its text source.
 *
 * The `mermaid` library is loaded lazily on the client, so pages without
 * diagrams never download it. Server-side rendering emits the diagram
 * source as a code block, which the rendered SVG replaces after hydration.
 * The diagram re-renders when the site theme switches between light and
 * dark.
 *
 * Requires the optional `mermaid` peer dependency to be installed.
 */
export function ArdoMermaid({ code, className }: ArdoMermaidProps) {
  const [state, setState] = useState<RenderState>({ status: "pending" })
  const reactId = useId()
  const isDark = useDocumentThemeIsDark()

  useEffect(() => {
    let cancelled = false
    const renderId = `ardo-mermaid-${reactId.replaceAll(/[^\w-]/g, "")}`

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid")
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
        })
        const { svg } = await mermaid.render(renderId, code)
        if (!cancelled) {
          setState({ status: "rendered", svg })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error)
          setState({ status: "error", message })
        }
        // Mermaid leaves detached error elements behind on failed renders
        document.getElementById(`d${renderId}`)?.remove()
      }
    }

    void renderDiagram()
    return () => {
      cancelled = true
    }
  }, [code, isDark, reactId])

  const containerClassName = className == null ? styles.mermaid : `${styles.mermaid} ${className}`

  if (state.status === "rendered") {
    return (
      <div
        className={containerClassName}
        data-theme={isDark ? "dark" : "light"}
        // eslint-disable-next-line react/no-danger -- SVG produced by mermaid with securityLevel: "strict"
        dangerouslySetInnerHTML={{ __html: state.svg }}
      />
    )
  }

  return (
    <div className={containerClassName} data-state={state.status}>
      {state.status === "error" && (
        <p className={styles.error} role="alert">
          Mermaid diagram failed to render: {state.message}
        </p>
      )}
      <pre className={styles.source}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
