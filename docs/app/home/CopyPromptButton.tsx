import { useEffect, useState } from "react"

import * as styles from "./home.css"

export const SETUP_PROMPT = "Set up Ardo in this repository and follow the official instructions."

/** Copies the setup prompt and says so for a moment. */
export function CopyPromptButton({ label = "Copy prompt" }: { label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(SETUP_PROMPT)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${styles.buttonPrimary}`}
      onClick={() => void copy()}
    >
      <span aria-live="polite">{copied ? "Copied!" : label}</span>
    </button>
  )
}
