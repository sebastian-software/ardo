import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Ardo Basic Example",
  description: "A simple documentation site built with Ardo",
  brand: {
    color: "blue",
    accent: "teal",
    neutral: "slate",
  },
  githubPages: false,
  seo: {
    sitemap: {
      exclude: ["/kit"],
    },
  },
})
