import { useState, useSyncExternalStore } from "react"
import { counter } from "./counter.css"

import { plural } from "@palamedes/core/macro"

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

/** An interactive imported component inside the Palamedes-compiled MDX example. */
export function LocaleCounter() {
  const [count, setCount] = useState(0)
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  return (
    <button
      className={counter}
      type="button"
      disabled={!hydrated}
      aria-live="polite"
      onClick={() => setCount(count + 1)}
    >
      {plural(count, { one: "# click", other: "# clicks" })}
    </button>
  )
}
