import { useState } from "ardo/react"
const failure = Reflect.get(globalThis, "__ardoFailure")
if (failure === "module" || failure === "catalog") throw new Error("Private import error")

export function meta() {
  if (failure === "metadata") throw new Error("Private metadata error")
  return [{ title: "Recovery fixture" }]
}

export default function RecoveryPage() {
  const [count, setCount] = useState(0)
  const [broken, setBroken] = useState(false)
  if (failure === "hydrate" || broken) throw new Error("Private render error")
  return (
    <>
      <h1>Readable static content</h1>
      <p>{failure === "mismatch" ? "Client content" : "Server content"}</p>
      <a href="./">Native page link</a>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <button onClick={() => setBroken(true)}>Break page</button>
    </>
  )
}
