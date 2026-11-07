import { defineArdoConfig } from "ardo/config"

// A site with its own document shell: no ArdoRoot, ArdoProvider, or ArdoRootLayout.
export default defineArdoConfig({
  title: "Custom shell example",
  siteUrl: "https://example.test",
  publication: {
    from: "posts",
    name: "Journal",
    tags: true,
    authors: { alex: { name: "Alex Morgan" } },
  },
})
