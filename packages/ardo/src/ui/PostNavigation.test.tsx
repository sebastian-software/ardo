// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react"
import { expect, it } from "vitest"
import type { Publication } from "../publication/types"
import { ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoPostNavigation } from "./PostNavigation"

const publication: Publication = {
  name: "News",
  path: "/de/news",
  url: "https://example.com/project/de/news/",
  atomUrl: "https://example.com/project/de/news/atom.xml",
  rssUrl: "https://example.com/project/de/news/rss.xml",
  imagePresets: {},
  posts: Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    title: `Release ${12 - index}`,
    path: `/de/news/release-${12 - index}`,
    url: `https://example.com/project/de/news/release-${12 - index}/`,
    publishedAt: `2026-10-${String(31 - index)}T09:00:00Z`,
    authors: [],
    tags: [],
    images: {},
    data: {},
    publicationPath: "/de/news",
    publicationName: "News",
    atomUrl: "https://example.com/project/de/news/atom.xml",
    rssUrl: "https://example.com/project/de/news/rss.xml",
  })),
}

function renderNavigation(path: string, data = publication, limit?: number) {
  render(
    <ArdoPageProvider base="/project/" path={path}>
      <ArdoProvider config={{ title: "Example" }} sidebar={[]}>
        <ArdoPostNavigation publication={data} limit={limit} />
      </ArdoProvider>
    </ArdoPageProvider>
  )
  return screen.getByRole("navigation", { name: "Latest articles" })
}

it("lists ten recent articles in publication order and keeps a link to the complete archive", () => {
  const navigation = renderNavigation("/de/news/release-11")
  const links = within(navigation).getAllByRole("link")
  expect(links.map((link) => link.textContent)).toStrictEqual([
    "Release 12",
    "Release 11",
    "Release 10",
    "Release 9",
    "Release 8",
    "Release 7",
    "Release 6",
    "Release 5",
    "Release 4",
    "Release 3",
    "All articles",
  ])
  expect(links[1].getAttribute("aria-current")).toBe("page")
  expect(links[1].getAttribute("href")).toBe("/project/de/news/release-11/")
  expect(links.at(-1)?.getAttribute("href")).toBe("/project/de/news/")
  expect(links.at(-1)?.getAttribute("aria-current")).toBeNull()
})

it("can shorten the recent list while marking the archive as current on the index", () => {
  const navigation = renderNavigation("/de/news/", publication, 2)
  expect(within(navigation).getAllByRole("link")).toHaveLength(3)
  expect(
    within(navigation).getByRole("link", { name: "All articles" }).getAttribute("aria-current")
  ).toBe("page")
})

it("keeps the archive accessible when no articles have been published", () => {
  const navigation = renderNavigation("/de/news", { ...publication, posts: [] })
  expect(within(navigation).queryByRole("list")).toBeNull()
  expect(within(navigation).getByText("No posts yet.")).toBeTruthy()
  expect(within(navigation).getByRole("link", { name: "All articles" }).getAttribute("href")).toBe(
    "/project/de/news/"
  )
})
