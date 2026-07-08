import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [{ title: "Ardo GitHub Pages Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo GitHub Pages Example"
        text="Documentation Made Simple"
        tagline="A GitHub Pages documentation site built with Ardo — no TypeDoc, just Markdown."
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
