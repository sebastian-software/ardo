import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [{ title: "Ardo Library Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Library Example"
        text="Library Documentation"
        tagline="Demonstrates Ardo with TypeDoc integration for automatic API reference generation."
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "API Reference", link: "/api-reference", theme: "alt" },
        ]}
      />
      <ArdoFeatures>
        <ArdoFeatureCard title="TypeDoc" icon="📚">
          Auto-generated API docs from TypeScript source code
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Prebuild" icon="🔧">
          TypeDoc runs before the build via prebuild.mjs
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Deployable" icon="🚀">
          Ready to deploy on Vercel as a static site
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
