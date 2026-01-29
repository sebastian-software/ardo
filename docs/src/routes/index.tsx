import { createFileRoute } from "@tanstack/react-router"
import { Hero, Features } from "ardo/ui"
import logo from "../assets/logo.svg"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero
        name="Ardo"
        text="React-first Documentation"
        tagline="Build beautiful documentation sites with React, TanStack Start, and Markdown. Automatically generate API references from TypeScript with built-in TypeDoc integration."
        image={logo}
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "View on GitHub", link: "https://github.com/sebastian-software/ardo", theme: "alt" },
        ]}
      />

      <Features
        items={[
          {
            title: "React-First",
            icon: "⚛️",
            details:
              "Built on TanStack Start and React. Use React components directly in your markdown.",
          },
          {
            title: "Lightning Fast",
            icon: "⚡",
            details:
              "Powered by Vite. Instant server start, lightning-fast HMR, and optimized builds.",
          },
          {
            title: "TypeDoc Integration",
            icon: "📚",
            details:
              "Auto-generate API documentation from your TypeScript source code with zero configuration.",
          },
          {
            title: "Type-Safe",
            icon: "📝",
            details:
              "Written in TypeScript with full type definitions. Get great DX with autocomplete.",
          },
        ]}
      />
    </>
  )
}
