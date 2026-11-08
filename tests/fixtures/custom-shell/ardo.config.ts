import { defineArdoConfig } from "ardo/config"

// A site with its own document shell: no ArdoRoot, ArdoProvider, or ArdoRootLayout.
export default defineArdoConfig({
  title: "Custom shell example",
  siteUrl: "https://example.test",
  publication: {
    from: "posts",
    name: "Journal",
    tags: true,
    // The root reads the page data these modules export, like a post's frontmatter.
    components: { index: "app/blog/Overview.tsx", tag: "app/blog/Tag.tsx" },
    authors: { alex: { name: "Alex Morgan" } },
  },
})
