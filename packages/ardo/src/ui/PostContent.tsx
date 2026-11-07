import { type ReactNode, use } from "react"
import { ArdoContext, useArdoPageData } from "../runtime/hooks"
import { ardoContent } from "./content.css"
import { ArdoDocContent } from "./DocPage"

/**
 * The MDX wrapper of every Markdown page. A generated publication post mounts its own frame in
 * its route, so the post frame, Ardo's or the site's, is not part of other pages' code. In a
 * custom shell without `ArdoRoot`, other pages render in a plain content container, because the
 * documentation frame needs the sidebar and site context that `ArdoRoot` provides.
 */
export function ArdoMarkdownContent({ children }: { children: ReactNode }) {
  const isPost = useArdoPageData()?.frontmatter._ardoPost != null
  // `ArdoRoot` renders `ArdoProvider`; a custom shell has none.
  const hasProvider = use(ArdoContext) != null
  if (isPost) return children
  if (!hasProvider) return <div className={`ardo-markdown ${ardoContent}`}>{children}</div>
  return <ArdoDocContent>{children}</ArdoDocContent>
}
