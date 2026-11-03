import { type ReactNode, use } from "react"

import type { ArdoMetaDescriptor } from "./page-context"

import { ArdoDocumentContext, type ArdoDocument } from "./document-context"
import { serializeJsonLd } from "./json-ld"

export type { ArdoDocument } from "./document-context"

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
      {document.navigation?.viewTransitionCss != null && (
        <style>{document.navigation.viewTransitionCss}</style>
      )}
      {document.navigation?.speculationRules != null && (
        <JsonScript type="speculationrules" value={document.navigation.speculationRules} />
      )}
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
  if ("script:ld+json" in descriptor) {
    return <JsonScript type="application/ld+json" value={descriptor["script:ld+json"]} />
  }
  if ("charSet" in descriptor) return <meta charSet={descriptor.charSet} />
  if ("tagName" in descriptor) {
    const { tagName, ...attributes } = descriptor
    return tagName === "link" ? <link {...attributes} /> : <meta {...attributes} />
  }
  return <meta {...descriptor} />
}

/** A JSON data script. The serializer escapes `<`, so the data cannot close the element. */
function JsonScript({ type, value }: { type: string; value: unknown }) {
  return <script type={type} dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />
}
