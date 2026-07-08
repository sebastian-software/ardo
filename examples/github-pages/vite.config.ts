import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  base: "/ardo/",
  plugins: [
    ardo({
      title: "Ardo GitHub Pages Example",
      description: "A GitHub Pages documentation site built with Ardo",
      githubPages: false,
    }),
  ],
})
