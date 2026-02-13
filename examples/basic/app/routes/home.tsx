import { Hero, Features } from "ardo/ui"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function HomePage() {
  return (
    <>
      <Hero
        name="Ardo Basic Example"
        text="Documentation Made Simple"
        tagline="A minimal documentation site built with Ardo — no TypeDoc, just Markdown."
        actions={[{ text: "Get Started", link: "/guide/getting-started", theme: "brand" }]}
      />
      <Features
        items={[
          {
            title: "Markdown",
            icon: "📝",
            details: "Write documentation in Markdown with full GFM support",
          },
          {
            title: "Fast",
            icon: "⚡",
            details: "Lightning fast builds powered by Vite",
          },
          {
            title: "Search",
            icon: "🔍",
            details: "Built-in full-text search with MiniSearch",
          },
        ]}
      />
    </>
  )
}
