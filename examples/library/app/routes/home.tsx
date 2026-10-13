import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "ardo/router"

export const meta: MetaFunction = () => [{ title: "Ardo Library Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Library Example"
        text="Library Documentation"
        tagline="Demonstrates Ardo with native API generation in builds and development."
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "API Reference", link: "/api-reference", theme: "alt" },
        ]}
      />
      <ArdoFeatures>
        <ArdoFeatureCard title="Native API" icon="📚">
          Auto-generated API docs from TypeScript source code
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Build and Watch" icon="🔧">
          API pages update through the normal Vite integration
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Deployable" icon="🚀">
          Ready to deploy on Vercel as a static site
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
