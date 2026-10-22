import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Ardo Sitemap Fixture",
  siteUrl: "https://docs.example.com",
  seo: {
    sitemap: {
      exclude: ["/kit"],
    },
  },
})
