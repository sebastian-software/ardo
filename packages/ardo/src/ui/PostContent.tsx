import type { ReactNode } from "react"
import type { Post } from "../publication/types"
import { useArdoPageData } from "../runtime/hooks"
import { ArdoDocContent } from "./DocPage"
import { ArdoPost } from "./Posts"

export function ArdoMarkdownContent({ children }: { children: ReactNode }) {
  const post = useArdoPageData()?.frontmatter._ardoPost as Post | undefined
  return post == null ? (
    <ArdoDocContent>{children}</ArdoDocContent>
  ) : (
    <ArdoPost post={post}>{children}</ArdoPost>
  )
}
