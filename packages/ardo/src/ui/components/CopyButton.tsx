import { useCallback, useEffect, useId, useState } from "react"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import * as styles from "./CopyButton.css"

type CopyButtonProps = {
  code: string
}

/**
 * A button that copies `code` to the clipboard and announces the result. Code blocks render it
 * already.
 */
export function ArdoCopyButton({ code }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const labels = useArdoLabels().copyButton
  const statusId = useId()
  const copied = status === "copied"
  const failed = status === "error"

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setStatus("idle"), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setStatus("copied")
    } catch {
      setStatus("error")
    }
  }

  return (
    <>
      <button
        type="button"
        className={`ardo-copy-button ${styles.copyButton}`}
        onClick={() => {
          void handleCopy()
        }}
        aria-label={copied ? labels.copied : labels.copyCode}
      >
        <ChromeIcon name={copied ? "copied" : "copy"} />
        <span className={styles.copyText}>{copied ? labels.copied : labels.copy}</span>
      </button>
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={failed ? styles.copyError : styles.copyStatus}
      >
        {failed ? labels.copyFailed : copied ? labels.copied : ""}
      </div>
      {failed && <ManualCode code={code} label={labels.manualCode} statusId={statusId} />}
    </>
  )
}

function ManualCode({ code, label, statusId }: { code: string; label: string; statusId: string }) {
  const selectCode = useCallback((field: HTMLTextAreaElement | null) => {
    field?.focus()
    field?.select()
  }, [])

  return (
    <div className={styles.copyRecovery}>
      <textarea
        ref={selectCode}
        aria-label={label}
        aria-describedby={statusId}
        className={styles.manualCode}
        value={code}
        readOnly
        rows={Math.min(8, Math.max(2, code.split("\n").length))}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  )
}
