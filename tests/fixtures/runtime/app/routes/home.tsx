import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { ArdoMetaFunction } from "ardo/runtime"
import { RuntimeCounter } from "../Counter"

export const meta: ArdoMetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Basic Example"
        text="Documentation Made Simple"
        tagline="A minimal documentation site built with Ardo — no API generation, just Markdown."
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
        <ArdoFeatureCard title="React runtime" icon="⚛️">
          Ardo, the app, and the renderer share the same React runtime.
          <RuntimeCounter />
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
