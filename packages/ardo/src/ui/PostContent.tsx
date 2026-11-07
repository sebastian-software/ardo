import type { ReactNode } from "react"
import { useArdoPageData } from "../runtime/hooks"
import { ArdoDocContent } from "./DocPage"

/**
 * The MDX wrapper of every Markdown page. A generated publication post mounts its own frame in
 * its route, so the post frame, Ardo's or the site's, is not part of other pages' code.
 */
export function ArdoMarkdownContent({ children }: { children: ReactNode }) {
  if (useArdoPageData()?.frontmatter._ardoPost != null) return children
  return <ArdoDocContent>{children}</ArdoDocContent>
}
