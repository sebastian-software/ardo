import { useEffect, useState } from "react"

import { useArdoLabels } from "../runtime/hooks"
import { ChromeIcon } from "./chrome-icons"
import * as styles from "./PageActions.css"

type CopyStatus = "idle" | "copied" | "error"

/**
 * "Copy page" and "View as Markdown" for a page that has a Markdown file at `markdownPath`.
 * The link works without scripts. Copying fetches the file on click, not at load.
 */
export function ArdoPageActions({ markdownPath }: { markdownPath: string }) {
  const labels = useArdoLabels()
  const [status, setStatus] = useState<CopyStatus>("idle")
  const copied = status === "copied"
  const failed = status === "error"

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setStatus("idle"), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    try {
      const response = await fetch(markdownPath)
      if (!response.ok) throw new Error(`Markdown request failed with ${response.status}`)
      await navigator.clipboard.writeText(await response.text())
      setStatus("copied")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className={`ardo-page-actions ${styles.pageActions}`}>
      <button
        type="button"
        className={`ardo-page-action ${styles.action}`}
        onClick={() => {
          void handleCopy()
        }}
      >
        <ChromeIcon name={copied ? "copied" : "copy"} />
        {copied ? labels.copyButton.copied : labels.page.copyMarkdown}
      </button>
      <a href={markdownPath} className={`ardo-page-action ${styles.action}`}>
        {labels.page.viewMarkdown}
      </a>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={failed ? styles.statusError : styles.statusHidden}
      >
        {failed ? labels.page.copyMarkdownFailed : ""}
      </span>
    </div>
  )
}
