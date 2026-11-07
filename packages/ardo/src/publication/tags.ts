import type { Post, PublicationTag } from "./types"

/** The posts listed on a tag archive, in publication order. */
export function taggedPosts(posts: Post[], tag: PublicationTag): Post[] {
  return posts.filter((post) => post.tags.includes(tag.key))
}
