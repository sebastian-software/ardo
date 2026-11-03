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
    isPartOf: {
      "@type": "WebSite",
      ...optionalField("name", input.siteName),
      ...optionalField("url", input.siteRootUrl),
    },
  }
  return `{ "script:ld+json": ${JSON.stringify(article)} }`
}

function optionalField(key: string, value?: string): Record<string, string> {
  return value == null || value === "" ? {} : { [key]: value }
}
