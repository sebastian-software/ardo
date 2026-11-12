/** Page facts that a `TechArticle` JSON-LD block describes. Empty values are left out. */
export type TechArticleInput = {
  headline: string
  description?: string
  url?: string
  inLanguage?: string
  image?: string
  siteName?: string
  /** Absolute URL of the site root, including the deployment base path. */
  siteRootUrl?: string
}

/** Post facts that a `BlogPosting` JSON-LD block describes. Empty values are left out. */
export type BlogPostingInput = {
  headline: string
  description?: string
  /** The page's rendered canonical URL. */
  mainEntityOfPage?: string
  inLanguage?: string
  datePublished: string
  dateModified?: string
  /** The post's authors in post order; `url` only when it is an absolute http(s) URL. */
  authors: ReadonlyArray<{ name: string; url?: string }>
  /** Absolute URL of the post's own share image or cover. */
  image?: string
  siteName?: string
  /** Absolute URL of the site root, including the deployment base path. */
  siteRootUrl?: string
}

/** A `meta` descriptor that renders the page's `TechArticle` as a JSON-LD script. */
export function buildTechArticleEntry(input: TechArticleInput): string {
  const article = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    ...optionalField("description", input.description),
    ...optionalField("url", input.url),
    ...optionalField("inLanguage", input.inLanguage),
    ...optionalField("image", input.image),
    isPartOf: isPartOf(input),
  }
  return `{ "script:ld+json": ${JSON.stringify(article)} }`
}

/** A `meta` descriptor that renders a publication post's `BlogPosting` as a JSON-LD script. */
export function buildBlogPostingEntry(input: BlogPostingInput): string {
  const posting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    ...optionalField("description", input.description),
    ...optionalField("mainEntityOfPage", input.mainEntityOfPage),
    ...optionalField("inLanguage", input.inLanguage),
    datePublished: input.datePublished,
    ...optionalField("dateModified", input.dateModified),
    author: input.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
      ...optionalField("url", author.url),
    })),
    ...optionalField("image", input.image),
    isPartOf: isPartOf(input),
  }
  return `{ "script:ld+json": ${JSON.stringify(posting)} }`
}

/** The `WebSite` an article or post belongs to. */
function isPartOf(input: { siteName?: string; siteRootUrl?: string }): Record<string, string> {
  return {
    "@type": "WebSite",
    ...optionalField("name", input.siteName),
    ...optionalField("url", input.siteRootUrl),
  }
}

function optionalField(key: string, value?: string): Record<string, string> {
  return value == null || value === "" ? {} : { [key]: value }
}
