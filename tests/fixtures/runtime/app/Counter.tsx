import { createContext, useContext, useEffect, useState } from "ardo/react"

const RuntimeContext = createContext<number | null>(null)

function useRuntimeCounter() {
  const initialCount = useContext(RuntimeContext)
  if (initialCount == null) throw new Error("RuntimeCounter requires its context provider")

  const [count, setCount] = useState(initialCount)
  return {
    count,
    increment: () => setCount((current) => current + 1),
  }
}

function CounterButton() {
  const { count, increment } = useRuntimeCounter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return (
    <button
      type="button"
      data-testid="runtime-counter"
      data-hydrated={hydrated ? "true" : undefined}
      onClick={increment}
    >
      Count: {count}
    </button>
  )
}

export function RuntimeCounter() {
  return (
    <RuntimeContext.Provider value={0}>
      <CounterButton />
    </RuntimeContext.Provider>
  )
}
