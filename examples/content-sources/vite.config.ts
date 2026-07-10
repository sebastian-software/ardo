import { defineConfig } from "vite"

import { ardo, defineCollection } from "ardo/vite"

const recipes = defineCollection<{ summary: string; title: string }>({
  from: "project-content/recipes",
  schema: (data) => ({
    summary: String(data.summary),
    title: String(data.title),
  }),
  to: "recipes",
})

export default defineConfig({
  plugins: [
    ardo({
      collections: { recipes },
      description: "External Markdown content materialized as routes and typed build data.",
      githubPages: false,
      title: "Ardo Content Sources Example",
    }),
  ],
})
