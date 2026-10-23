import { defineArdoConfig } from "ardo/config"
import { defineCollection } from "ardo/vite"

const recipes = defineCollection<{ summary: string; title: string }>({
  from: "project-content/recipes",
  schema: (data) => ({ summary: String(data.summary), title: String(data.title) }),
  to: "recipes",
})

export default defineArdoConfig({
  title: "Ardo Content Sources Fixture",
  collections: { recipes },
})
