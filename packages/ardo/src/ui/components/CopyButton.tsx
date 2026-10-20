import { useState } from "react"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import * as styles from "./CopyButton.css"

type CopyButtonProps = {
  code: string
}

export function ArdoCopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const labels = useArdoLabels()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <button
      type="button"
      className={`ardo-copy-button ${styles.copyButton}`}
      onClick={() => {
        void handleCopy()
      }}
      aria-label={copied ? labels.copyButton.copied : labels.copyButton.copyCode}
    >
      <ChromeIcon name={copied ? "copied" : "copy"} />
      <span className={styles.copyText}>
        {copied ? labels.copyButton.copied : labels.copyButton.copy}
      </span>
    </button>
  )
}
