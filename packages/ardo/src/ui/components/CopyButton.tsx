import { useState } from "react"

import { CheckIcon, CopyIcon } from "../icons"
import * as styles from "./CopyButton.css"

interface CopyButtonProps {
  code: string
}

export function ArdoCopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

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
      className={styles.copyButton}
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      <span className={styles.copyText}>{copied ? "Copied!" : "Copy"}</span>
    </button>
  )
}
