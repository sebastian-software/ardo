import type { ReactNode } from "react"
import type { AuthorProfile, ImagePreset, Post, Publication } from "../publication/types"
import { useArdoConfig, useArdoLabels } from "../runtime/hooks"
import { useArdoPath } from "../runtime/page-context"
import { ArdoLink } from "../runtime/page"
import { ardoContent } from "./content.css"
import { ArdoImage } from "./PostImage"
import * as styles from "./Posts.css"

export type ArdoPostProps = { post: Post; children: ReactNode }
export type ArdoPostListProps = { publication: Publication; imagePreset?: ImagePreset }

export function ArdoPost({ post, children }: ArdoPostProps) {
  const lang = usePostLocale()
  const labels = useArdoLabels().publication
  return (
    <article className={`ardo-post ${styles.article}`}>
      <header className={styles.heading}>
        <ArdoLink to={post.publicationPath} className={styles.back}>
          {post.publicationName}
        </ArdoLink>
        <p className={styles.date}>
          <PostDate value={post.publishedAt} lang={lang} />
        </p>
        <h1 className={styles.title}>{post.title}</h1>
        {post.description && <p className={styles.description}>{post.description}</p>}
        <Byline authors={post.authors} />
      </header>
      {post.coverImage && (
        <figure className={styles.cover}>
          <ArdoImage image={post.coverImage} loading="eager" fetchPriority="high" />
          {post.coverImage.caption && <figcaption>{post.coverImage.caption}</figcaption>}
        </figure>
      )}
      <div className={`ardo-post-body ${ardoContent} ${styles.body}`}>{children}</div>
      <footer className={styles.postFooter}>
        {post.tags.length > 0 && (
          <ul className={styles.tags} aria-label={labels.tags}>
            {post.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
        {post.updatedAt && (
          <p>
            {labels.updated} <PostDate value={post.updatedAt} lang={lang} />
          </p>
        )}
        <FeedLinks atom={post.atomUrl} rss={post.rssUrl} />
      </footer>
    </article>
  )
}

/** A chronological editorial list. Its data already excludes drafts and scheduled posts. */
export function ArdoPostList({ publication, imagePreset }: ArdoPostListProps) {
  const lang = usePostLocale()
  const labels = useArdoLabels().publication
  return (
    <section className={`ardo-post-list ${styles.publication}`}>
      <header className={styles.publicationHeader}>
        <h1 className={styles.title}>{publication.name}</h1>
        {publication.description && <p className={styles.description}>{publication.description}</p>}
        <FeedLinks atom={publication.atomUrl} rss={publication.rssUrl} />
      </header>
      {publication.posts.length === 0 ? (
        <p>{labels.noPosts}</p>
      ) : (
        <ol className={styles.list}>
          {publication.posts.map((post) => (
            <li key={post.id} className={styles.listItem}>
              <article className={styles.preview}>
                {post.coverImage && (
                  <ArdoLink
                    to={post.path}
                    className={styles.thumbnail}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ArdoImage
                      image={post.coverImage}
                      preset={imagePreset ?? publication.imagePresets.card}
                      alt=""
                    />
                  </ArdoLink>
                )}
                <div>
                  <p className={styles.date}>
                    <PostDate value={post.publishedAt} lang={lang} />
                  </p>
                  <h2 className={styles.previewTitle}>
                    <ArdoLink to={post.path}>{post.title}</ArdoLink>
                  </h2>
                  {post.description && (
                    <p className={styles.previewDescription}>{post.description}</p>
                  )}
                  <Byline authors={post.authors} compact />
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function PostDate({ value, lang }: { value: string; lang: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(lang, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))}
    </time>
  )
}

function Byline({ authors, compact = false }: { authors: AuthorProfile[]; compact?: boolean }) {
  const labels = useArdoLabels().publication
  return (
    <ul className={styles.authors} aria-label={labels.authors}>
      {authors.map((author) => (
        <li className={styles.author} key={author.id ?? author.did ?? author.url ?? author.name}>
          {!compact && author.avatar && (
            <img className={styles.avatar} src={author.avatar} alt="" width={40} height={40} />
          )}
          <div>
            {author.url ? (
              <a href={author.url} rel="author">
                {author.name}
              </a>
            ) : (
              <span>{author.name}</span>
            )}
            {!compact && author.title && (
              <small className={styles.authorTitle}>{author.title}</small>
            )}
            {!compact && author.description && (
              <p className={styles.authorBio}>{author.description}</p>
            )}
            {!compact && author.links && (
              <span className={styles.authorLinks}>
                {author.links.map((link) => (
                  <a key={link.url} href={link.url}>
                    {link.name}
                  </a>
                ))}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function FeedLinks({ atom, rss }: { atom: string; rss: string }) {
  const labels = useArdoLabels().publication
  return (
    <p className={styles.feeds}>
      {labels.subscribeVia}{" "}
      <a href={atom} type="application/atom+xml">
        Atom
      </a>{" "}
      {labels.or}{" "}
      <a href={rss} type="application/rss+xml">
        RSS
      </a>
    </p>
  )
}

function usePostLocale(): string {
  const config = useArdoConfig()
  const path = useArdoPath()
  return (
    (config.i18n == null || config.i18n === false
      ? undefined
      : config.i18n.locales.find((locale) => locale.id === path.split("/")[1])?.id) ??
    config.lang ??
    "en"
  )
}
