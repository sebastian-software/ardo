import type { Publication } from "../publication/types"
import { useArdoLabels } from "../runtime/hooks"
import { ArdoActiveLink } from "../runtime/page"
import * as styles from "./PostNavigation.css"

export type ArdoPostNavigationProps = {
  publication: Publication
  /** Maximum number of recent articles. Defaults to ten; the archive remains complete. */
  limit?: number
}

/** Compact publication navigation for a mobile menu or a site-owned sidebar. */
export function ArdoPostNavigation({ publication, limit = 10 }: ArdoPostNavigationProps) {
  const labels = useArdoLabels().publication
  const posts = publication.posts.slice(0, Math.max(0, limit))
  return (
    <nav className={`ardo-post-navigation ${styles.navigation}`} aria-label={labels.recentPosts}>
      <p className={styles.heading}>{labels.recentPosts}</p>
      {publication.posts.length === 0 && <p className={styles.empty}>{labels.noPosts}</p>}
      {posts.length > 0 && (
        <ol className={styles.list}>
          {posts.map((post) => (
            <li key={post.id}>
              <ArdoActiveLink to={post.path} end className={styles.link}>
                {post.title}
              </ArdoActiveLink>
            </li>
          ))}
        </ol>
      )}
      <ArdoActiveLink to={publication.path} end className={styles.archive}>
        {labels.allPosts}
      </ArdoActiveLink>
    </nav>
  )
}
