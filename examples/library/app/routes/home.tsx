import { ArdoHero, ArdoFeatures } from "ardo/ui"
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
      <ArdoFeatures
        items={[
          {
            title: "TypeDoc",
            icon: "📚",
            details: "Auto-generated API docs from TypeScript source code",
          },
          {
            title: "Prebuild",
            icon: "🔧",
            details: "TypeDoc runs before the build via prebuild.mjs",
          },
          {
            title: "Deployable",
            icon: "🚀",
            details: "Ready to deploy on Vercel as a static site",
          },
        ]}
      />
    </>
  )
}
