// @vitest-environment jsdom

import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { Post } from "../publication/types"
import { ArdoPageDataProvider, ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoMarkdownContent } from "./PostContent"

vi.mock("virtual:ardo/publication-post", () => ({
  default: ({ post: frame, children }: { post: Post; children: ReactNode }) => (
    <article data-site="post">
      <h1>{frame.title}</h1>
      {children}
    </article>
  ),
}))

const post: Post = {
  id: "first",
  title: "A site-designed post",
  publishedAt: "2026-10-20T09:00:00.000Z",
  tags: [],
  authors: [],
  images: {},
  path: "/blog/first",
  url: "https://example.test/blog/first",
  publicationPath: "/blog",
  publicationName: "Blog",
  atomUrl: "https://example.test/blog/atom.xml",
  rssUrl: "https://example.test/blog/rss.xml",
}

it("frames generated posts with the site's post component instead of Ardo's article", () => {
  const html = renderToStaticMarkup(
    <ArdoPageProvider base="/" path="/blog/first">
      <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
        <ArdoPageDataProvider frontmatter={{ _ardoPost: post }} toc={[]}>
          <ArdoMarkdownContent>
            <p>Body text.</p>
          </ArdoMarkdownContent>
        </ArdoPageDataProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
  expect(html).toBe(
    '<article data-site="post"><h1>A site-designed post</h1><p>Body text.</p></article>'
  )
})
