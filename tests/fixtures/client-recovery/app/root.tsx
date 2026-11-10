import { useState } from "ardo/react"
import { ArdoOutlet, type ArdoClientRecovery } from "ardo/runtime"

export const clientRecovery: ArdoClientRecovery = ({ lang }) => {
  if (Reflect.get(globalThis, "__ardoFailure") === "catalog")
    throw new Error("Private catalog error")
  return {
    className: "site-recovery",
    title: lang === "de" ? "Die Website braucht einen Neustart" : "The site needs a fresh start",
  }
}

export default function Root() {
  const [broken, setBroken] = useState(false)
  if (broken) throw new Error("Private chrome error")
  return (
    <main data-custom-chrome>
      <button onClick={() => setBroken(true)}>Break chrome</button>
      <ArdoOutlet />
    </main>
  )
}

export function ErrorBoundary() {
  return <h1>Custom missing page</h1>
}
