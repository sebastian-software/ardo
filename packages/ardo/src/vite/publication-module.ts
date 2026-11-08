import type { AuthorProfile, Post, Publication } from "../publication/types"
import { FREEZE_SOURCE } from "./publication-freeze"

/**
 * A post as `virtual:ardo/publication` ships it: shared fields once, authors by index. A post's
 * `data` stays in its own route, so listing pages do not load every post's custom fields.
 */
type CompactPost = Omit<
  Post,
  "authors" | "data" | "url" | "publicationPath" | "publicationName" | "atomUrl" | "rssUrl"
> & { authors: number[]; url?: string }

type CompactPublication = Omit<Publication, "posts"> & {
  /** Every distinct author of the publication's posts, referenced by index. */
  authors: AuthorProfile[]
  /** A post URL is this prefix, the path without its first slash, and `postUrlSlash`. */
  postUrlPrefix: string
  postUrlSlash: string
  posts: CompactPost[]
}

/**
 * The source of `virtual:ardo/publication`. Each post record would otherwise repeat its
 * publication's name, path, and feed URLs and full author profiles, so the module ships them once
 * and rebuilds the public `Post` shape when it loads. The data is frozen: every page and site
 * module shares it, and a mutation must not change what another page renders.
 */
export function publicationModuleCode(
  publications: Record<string, Publication>,
  defaultKey: string
): string {
  const data = Object.fromEntries(
    Object.entries(publications).map(([key, publication]) => [key, compact(publication)])
  )
  return [
    FREEZE_SOURCE,
    "function _ardoExpand(publication) {",
    "  const { authors, postUrlPrefix, postUrlSlash, posts, ...shared } = publication;",
    "  return { ...shared, posts: posts.map((post) => ({",
    "    ...post,",
    "    authors: post.authors.map((index) => authors[index]),",
    "    data: {},",
    "    url: post.url ?? postUrlPrefix + post.path.slice(1) + postUrlSlash,",
    "    publicationPath: shared.path,",
    "    publicationName: shared.name,",
    "    atomUrl: shared.atomUrl,",
    "    rssUrl: shared.rssUrl,",
    "  })) };",
    "}",
    `const _ardoData = ${JSON.stringify(data)};`,
    "export const publications = _ardoFreeze(Object.fromEntries(Object.entries(_ardoData).map(([key, publication]) => [key, _ardoExpand(publication)])));",
    `export default publications[${JSON.stringify(defaultKey)}];`,
    "",
  ].join("\n")
}

function compact(publication: Publication): CompactPublication {
  const { posts, ...shared } = publication
  const authors: AuthorProfile[] = []
  const indexes = new Map<string, number>()
  const authorIndex = (author: AuthorProfile) => {
    const key = JSON.stringify(author)
    let index = indexes.get(key)
    if (index == null) {
      index = authors.push(author) - 1
      indexes.set(key, index)
    }
    return index
  }
  // The index URL shows the publication's spelling: `/news/` or `/news`.
  const slash = publication.url.endsWith("/") ? "/" : ""
  const prefix = publication.url.slice(
    0,
    publication.url.length - slash.length - publication.path.length + 1
  )
  return {
    ...shared,
    authors,
    postUrlPrefix: prefix,
    postUrlSlash: slash,
    posts: posts.map((post) => {
      const {
        authors: postAuthors,
        url,
        publicationPath: _path,
        publicationName: _name,
        atomUrl: _atom,
        rssUrl: _rss,
        data: _data,
        ...own
      } = post
      const derived = `${prefix}${post.path.slice(1)}${slash}`
      return {
        ...own,
        authors: postAuthors.map((author) => authorIndex(author)),
        ...(url === derived ? {} : { url }),
      }
    }),
  }
}
