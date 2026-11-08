import type { PublicationIndexFrontmatterArgs, PublicationIndexProps } from "ardo/config"

export default function Overview({ publication }: PublicationIndexProps) {
  return (
    <ul data-site="overview">
      {publication.posts.map((post) => (
        <li key={post.id}>
          <a href={post.url}>{post.title}</a>
        </li>
      ))}
    </ul>
  )
}

// Page data for the root, which links the German counterpart of this page.
export function frontmatter({ publication }: PublicationIndexFrontmatterArgs) {
  return { counterpart: `https://de.example.test/journal?posts=${publication.posts.length}` }
}
