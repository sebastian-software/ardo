declare module "virtual:docs/npm-facts" {
  import type { NpmFacts } from "./home/npm-facts"

  /** npm facts fetched once when the site is built or the dev server starts. */
  const facts: NpmFacts | null
  export default facts
}
