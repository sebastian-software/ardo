import type { CSSProperties } from "react"

import * as styles from "./Embed.css"

const DEFAULT_ASPECT_RATIO = "16 / 9"

export type ArdoEmbedProps = {
  /**
   * HTTPS URL of the content to embed, such as a video player page. Relative URLs and other
   * protocols render nothing and log a warning in development.
   */
  src: string
  /** Accessible title of the frame, announced by screen readers. */
  title: string
  /** Width-to-height ratio of the frame, as a CSS `aspect-ratio` value. Defaults to `"16 / 9"`. */
  aspectRatio?: string
  /** Permissions for the frame, as an `allow` attribute value, such as `"fullscreen"`. */
  allow?: string
  /** Additional CSS class. */
  className?: string
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Responsive iframe for videos and other embeddable content.
 *
 * The frame loads lazily and sends only the origin as the referrer. It has no `sandbox`
 * attribute, so the embedded page runs with the default iframe permissions. Only embed content
 * you trust.
 *
 * @example
 * ```mdx
 * <Embed src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Product tour" />
 * ```
 */
export function ArdoEmbed({
  src,
  title,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  allow,
  className,
}: ArdoEmbedProps) {
  if (!isHttpsUrl(src)) {
    if (import.meta.env?.DEV) {
      console.warn(`[Ardo] ArdoEmbed only renders https: URLs. Skipped "${src}".`)
    }
    return null
  }

  const wrapperClassName = className == null ? styles.embed : `${styles.embed} ${className}`
  const wrapperStyle: CSSProperties = { aspectRatio }

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {/* eslint-disable-next-line react/iframe-missing-sandbox -- Sandbox is an intentional opt-out; see the JSDoc. */}
      <iframe
        className={styles.frame}
        src={src}
        title={title}
        allow={allow}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
