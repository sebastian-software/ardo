import { Hero, Features } from "ardo/ui"

export default function HomePage() {
  return (
    <>
      <Hero
        name="Ardo Monorepo Example"
        text="Multi-Package Documentation"
        tagline="Demonstrates Ardo with multiple TypeDoc entry points from a monorepo structure."
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "Alpha API", link: "/api-reference/alpha", theme: "alt" },
          { text: "Beta API", link: "/api-reference/beta", theme: "alt" },
        ]}
      />
      <Features
        items={[
          {
            title: "Alpha Package",
            icon: "🔢",
            details: "Math utilities: add, subtract, multiply, divide, clamp",
          },
          {
            title: "Beta Package",
            icon: "📝",
            details: "String utilities: capitalize, slugify, truncate, repeat",
          },
          {
            title: "Unified Docs",
            icon: "📦",
            details: "Both packages documented in a single Ardo site",
          },
        ]}
      />
    </>
  )
}
