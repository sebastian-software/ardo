import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [{ title: "Ardo Monorepo Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Monorepo Example"
        text="Multi-Package Documentation"
        tagline="Demonstrates Ardo with multiple TypeDoc entry points from a monorepo structure."
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "Alpha API", link: "/api-reference/alpha", theme: "alt" },
          { text: "Beta API", link: "/api-reference/beta", theme: "alt" },
        ]}
      />
      <ArdoFeatures>
        <ArdoFeatureCard title="Alpha Package" icon="🔢">
          Math utilities: add, subtract, multiply, divide, clamp
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Beta Package" icon="📝">
          String utilities: capitalize, slugify, truncate, repeat
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Unified Docs" icon="📦">
          Both packages documented in a single Ardo site
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
