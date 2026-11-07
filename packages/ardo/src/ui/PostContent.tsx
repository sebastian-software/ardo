import type { ReactNode } from "react"
import SitePost from "virtual:ardo/publication-post"
import type { Post } from "../publication/types"
import { useArdoPageData } from "../runtime/hooks"
import { ArdoDocContent } from "./DocPage"
import { ArdoPost } from "./Posts"

export function ArdoMarkdownContent({ children }: { children: ReactNode }) {
  const post = useArdoPageData()?.frontmatter._ardoPost as Post | undefined
  if (post == null) return <ArdoDocContent>{children}</ArdoDocContent>
  // `publication.components.post` replaces Ardo's article frame on generated post routes.
  const Frame = SitePost ?? ArdoPost
  return <Frame post={post}>{children}</Frame>
}
