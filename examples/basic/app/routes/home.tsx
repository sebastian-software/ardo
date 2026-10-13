import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "ardo/router"
import { Counter } from "../Counter"

export const meta: MetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Basic Example"
        text="Documentation Made Simple"
        tagline="A small documentation site with Markdown and React components."
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
        <ArdoFeatureCard title="React components" icon="⚛️">
          Add interactive React components to your documentation.
          <Counter />
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
