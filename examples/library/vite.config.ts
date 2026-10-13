import { ardo, defineConfig } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "Ardo Library Example",
      description: "A library documentation site with native TypeScript API documentation",
      api: {
        entryPoints: ["./src/index.ts"],
        tsconfig: "./tsconfig.api.json",
      },
      brand: {
        color: "purple",
        accent: "pink",
        neutral: "slate",
      },
      githubPages: false,
    }),
  ],
})
