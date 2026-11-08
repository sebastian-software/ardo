import type { PublicationTagFrontmatterArgs, PublicationTagProps } from "ardo/config"

export default function Tag({ label, posts }: PublicationTagProps) {
  return (
    <section data-site="tag">
      <h1>{label}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={post.url}>{post.title}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Computed from this archive's own tag and posts, so every tag gets its own value.
export function frontmatter({ tag, posts }: PublicationTagFrontmatterArgs) {
  return {
    counterpart: `https://de.example.test/journal/schlagworte/${tag.key}?posts=${posts.length}`,
  }
}
