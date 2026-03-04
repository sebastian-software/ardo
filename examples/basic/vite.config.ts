import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Basic Example",
      description: "A simple documentation site built with Ardo",
      githubPages: false,
    }),
  ],
})
