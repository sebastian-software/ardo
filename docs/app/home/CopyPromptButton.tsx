import { useEffect, useId, useRef, useState } from "react"

import * as styles from "./home.css"

export const SETUP_PROMPT = "Set up Ardo in this repository and follow the official instructions."

/** Copies the setup prompt and says so for a moment. */
export function CopyPromptButton({ label = "Copy prompt" }: { label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")
  const promptId = useId()
  const promptRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === "failed") {
      promptRef.current?.focus()
      return
    }
    if (status !== "copied") return
    const timer = window.setTimeout(() => setStatus("idle"), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(SETUP_PROMPT)
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
  }

  return (
    <div className={styles.promptCopyControl}>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonPrimary}`}
        onClick={() => void copy()}
      >
        <span aria-live="polite">{status === "copied" ? "Copied!" : label}</span>
      </button>
      {status === "failed" && (
        <div className={styles.promptCopyFallback}>
          <p id={`${promptId}-error`} role="status" className={styles.promptCopyError}>
            Copying failed. Copy the prompt below manually.
          </p>
          <label htmlFor={promptId} className={styles.promptCopyError}>
            Setup prompt
          </label>
          <textarea
            ref={promptRef}
            id={promptId}
            aria-describedby={`${promptId}-error`}
            className={styles.promptCopyField}
            readOnly
            value={SETUP_PROMPT}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  )
}
