import { Hero, Features } from "ardo/ui"

export default function HomePage() {
  return (
    <>
      <Hero
        name="Ardo Library Example"
        text="Library Documentation"
        tagline="Demonstrates Ardo with TypeDoc integration for automatic API reference generation."
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          { text: "API Reference", link: "/api-reference", theme: "alt" },
        ]}
      />
      <Features
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
