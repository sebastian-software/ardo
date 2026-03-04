import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Library Example",
      description: "A library documentation site with TypeDoc integration",
      githubPages: false,
    }),
  ],
})
