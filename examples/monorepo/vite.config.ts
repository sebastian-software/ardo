import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Monorepo Example",
      description: "A monorepo documentation site with multiple TypeDoc entry points",
      githubPages: false,
    }),
  ],
})
