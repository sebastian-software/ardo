import { useState } from "react"
import { counter } from "./counter.css"

import { plural } from "@palamedes/core/macro"

/** An interactive imported component inside the Palamedes-compiled MDX example. */
export function LocaleCounter() {
  const [count, setCount] = useState(0)
  return (
    <button
      className={counter}
      type="button"
      aria-live="polite"
      onClick={() => setCount(count + 1)}
    >
      {plural(count, { one: "# click", other: "# clicks" })}
    </button>
  )
}
