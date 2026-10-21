import { createContext, type ReactNode, use } from "react"

import type { ArdoMetaDescriptor } from "./page-context"

/** Everything the HTML shell needs that only the renderer knows. */
export type ArdoDocument = {
  /** Head tags from the page's or the root's `meta` export. */
  meta: ArdoMetaDescriptor[]
  /** Stylesheets the page needs before it paints. */
  stylesheets: string[]
  /** Module chunks the browser can fetch while it parses the page. */
  modulePreloads: string[]
  /** URL of the client entry that hydrates the page. */
  entry?: string
}

const ArdoDocumentContext = createContext<ArdoDocument | null>(null)

export function ArdoDocumentProvider({
  value,
  children,
}: {
  value: ArdoDocument
  children: ReactNode
}) {
  return <ArdoDocumentContext value={value}>{children}</ArdoDocumentContext>
}

/** Title, meta tags, stylesheets, and module preloads of the current page. */
export function ArdoHead() {
  const document = use(ArdoDocumentContext)
  if (document == null) return null
  return (
    <>
      {document.meta.map((descriptor) => (
        <MetaTag key={JSON.stringify(descriptor)} descriptor={descriptor} />
      ))}
      {document.stylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {document.modulePreloads.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
    </>
  )
}

/** The client entry that hydrates the page. Place at the end of `<body>`. */
export function ArdoScripts() {
  const document = use(ArdoDocumentContext)
  if (document?.entry == null) return null
  return <script type="module" src={document.entry} />
}

function MetaTag({ descriptor }: { descriptor: ArdoMetaDescriptor }) {
  if ("title" in descriptor) return <title>{descriptor.title}</title>
  if ("charSet" in descriptor) return <meta charSet={descriptor.charSet} />
  if ("tagName" in descriptor) {
    const { tagName, ...attributes } = descriptor
    return tagName === "link" ? <link {...attributes} /> : <meta {...attributes} />
  }
  return <meta {...descriptor} />
}
