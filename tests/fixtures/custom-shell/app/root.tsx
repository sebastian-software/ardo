import type { ReactNode } from "ardo/react"
import { ArdoHead, ArdoOutlet, ArdoScripts, useArdoPage } from "ardo/runtime"

// The fully custom shell from the layout guide: Ardo renders the head, the page, and the client
// entry, and nothing else of its documentation frame.
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ArdoHead />
      </head>
      <body>
        {children}
        <ArdoScripts />
      </body>
    </html>
  )
}

export default function Root() {
  // A custom frontmatter field of the current page, from its own route chunk.
  const counterpart = useArdoPage().frontmatter?.counterpart
  return (
    <main data-shell="custom">
      {typeof counterpart === "string" && (
        <a data-counterpart href={counterpart}>
          Deutsch
        </a>
      )}
      <ArdoOutlet />
    </main>
  )
}
