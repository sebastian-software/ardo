import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Basic Example"
        text="Documentation Made Simple"
        tagline="A minimal documentation site built with Ardo — no TypeDoc, just Markdown."
        actions={[{ text: "Get Started", link: "/guide/getting-started", theme: "brand" }]}
      />
      <ArdoFeatures>
        <ArdoFeatureCard title="Markdown" icon="📝">
          Write documentation in Markdown with full GFM support
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Fast" icon="⚡">
          Lightning fast builds powered by Vite
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Search" icon="🔍">
          Built-in full-text search with MiniSearch
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
