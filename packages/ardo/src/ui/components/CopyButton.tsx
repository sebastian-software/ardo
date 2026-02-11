import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CopyButtonProps {
  code: string
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <button
      className="ardo-copy-button"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span className="ardo-copy-text">{copied ? "Copied!" : "Copy"}</span>
    </button>
  )
}
