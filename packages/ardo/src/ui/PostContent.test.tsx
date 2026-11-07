// @vitest-environment jsdom

import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { Post, Publication } from "../publication/types"
import { ArdoPageDataProvider, ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoMarkdownContent } from "./PostContent"
import { ArdoPost, ArdoPostList } from "./Posts"
import { ArdoPublicationTags } from "./publication-tags"

const post: Post = {
  id: "first",
  title: "A site-designed post",
  publishedAt: "2026-10-20T09:00:00.000Z",
  tags: ["design", "release-notes"],
  authors: [],
  images: {},
  data: {},
  path: "/blog/first",
  url: "https://example.test/blog/first",
  publicationPath: "/blog",
  publicationName: "Blog",
  atomUrl: "https://example.test/blog/atom.xml",
  rssUrl: "https://example.test/blog/rss.xml",
}

const publication: Publication = {
  imagePresets: {},
  name: "Blog",
  path: "/blog",
  url: "https://example.test/blog/",
  atomUrl: post.atomUrl,
  rssUrl: post.rssUrl,
  posts: [post],
  tags: [
    { key: "design", path: "/blog/tags/design", url: "https://example.test/blog/tags/design/" },
  ],
}

const labels: Record<string, string> = { design: "Gestaltung", "release-notes": "Versionshinweise" }

function render(node: ReactNode, frontmatter: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    <ArdoPageProvider base="/" path="/blog/first">
      <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
        <ArdoPageDataProvider frontmatter={frontmatter} toc={[]}>
          {node}
        </ArdoPageDataProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

it("leaves generated posts to the frame their route mounts", () => {
  const html = render(
    <ArdoMarkdownContent>
      <p>Body text.</p>
    </ArdoMarkdownContent>,
    { _ardoPost: post }
  )
  expect(html).toBe("<p>Body text.</p>")
})

it("frames other Markdown pages as documentation", () => {
  const html = render(
    <ArdoMarkdownContent>
      <p>Body text.</p>
    </ArdoMarkdownContent>
  )
  expect(html).toContain("<p>Body text.</p>")
  expect(html).not.toBe("<p>Body text.</p>")
  expect(html).not.toContain("ardo-post")
})

it("shows the site's tag labels on the post and links them to archives that exist", () => {
  const html = render(
    <ArdoPublicationTags label={(key) => labels[key]} archive="/blog/tags/">
      <ArdoPost post={post}>
        <p>Body text.</p>
      </ArdoPost>
    </ArdoPublicationTags>
  )
  expect(html).toContain('<li><a rel="tag" href="/blog/tags/design/">Gestaltung</a></li>')
  expect(html).toContain(
    '<li><a rel="tag" href="/blog/tags/release-notes/">Versionshinweise</a></li>'
  )
  expect(html).not.toContain(">design<")
})

it("shows labels without links while tag archives are off", () => {
  const html = render(
    <ArdoPublicationTags label={(key) => labels[key]}>
      <ArdoPost post={post}>
        <p>Body text.</p>
      </ArdoPost>
    </ArdoPublicationTags>
  )
  expect(html).toContain("<li>Gestaltung</li>")
  expect(html).not.toContain('rel="tag"')
})

it("falls back to the tag key without a tagLabel module", () => {
  const html = render(
    <ArdoPublicationTags archive="/blog/tags/">
      <ArdoPost post={post}>
        <p>Body text.</p>
      </ArdoPost>
    </ArdoPublicationTags>
  )
  expect(html).toContain('<a rel="tag" href="/blog/tags/design/">design</a>')
  // Outside a generated route, as before: plain keys.
  expect(
    render(
      <ArdoPost post={post}>
        <p>Body text.</p>
      </ArdoPost>
    )
  ).toContain("<li>design</li>")
})

it("titles a tag archive with the tag's label", () => {
  const tag = publication.tags![0]
  expect(
    render(
      <ArdoPublicationTags label={(key) => labels[key]} archive="/blog/tags/">
        <ArdoPostList publication={publication} tag={tag} />
      </ArdoPublicationTags>
    )
  ).toMatch(/<h1[^>]*>Gestaltung<\/h1>/u)
  expect(render(<ArdoPostList publication={publication} tag={tag} />)).toMatch(
    /<h1[^>]*>design<\/h1>/u
  )
})

function renderBare(node: ReactNode, frontmatter: Record<string, unknown>) {
  return renderToStaticMarkup(
    <ArdoPageProvider base="/" path="/blog/first">
      <ArdoPageDataProvider frontmatter={frontmatter} toc={[]}>
        {node}
      </ArdoPageDataProvider>
    </ArdoPageProvider>
  )
}

describe("Markdown in a custom shell without ArdoProvider", () => {
  it("renders a page in a plain content container instead of throwing", () => {
    const html = renderBare(
      <ArdoMarkdownContent>
        <p>Body text.</p>
      </ArdoMarkdownContent>,
      { title: "Notes" }
    )
    expect(html).toMatch(/^<div class="ardo-markdown [^"]+"><p>Body text.<\/p><\/div>$/u)
  })

  it("leaves a post to its frame and still gives its content the page data", () => {
    const html = renderBare(
      <ArdoMarkdownContent>
        <p>Body text.</p>
      </ArdoMarkdownContent>,
      { _ardoPost: post }
    )
    expect(html).toBe("<p>Body text.</p>")
  })
})
