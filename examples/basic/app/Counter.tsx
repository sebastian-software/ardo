import { useState } from "ardo/react"

// Ardo's theme tokens are plain CSS custom properties, so a component can match
// the site in light and dark mode without a styling library.
const buttonStyle = {
  font: "inherit",
  fontSize: "var(--ardo-fontSize-sm)",
  fontVariantNumeric: "tabular-nums",
  padding: "var(--ardo-space-xs) var(--ardo-space-md)",
  border: "1px solid var(--ardo-color-border)",
  borderRadius: "var(--ardo-radius-full)",
  background: "var(--ardo-color-bgSoft)",
  color: "var(--ardo-color-text)",
  cursor: "pointer",
} as const

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button type="button" style={buttonStyle} onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
