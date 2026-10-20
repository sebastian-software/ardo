import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import type { MetaFunction } from "ardo/router"
import { Counter } from "../Counter"

export const meta: MetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="Ardo Basic Example"
        tagline="A small documentation site with Markdown guides, search, and a React component."
        actions={[
          { text: "Get started", link: "/guide/getting-started", theme: "brand" },
          { text: "Markdown features", link: "/guide/markdown-features", theme: "alt" },
        ]}
      />
      <ArdoFeatures title="What this example shows">
        <ArdoFeatureCard title="Markdown guides">
          Pages in app/routes/guide become the sidebar. Write them in Markdown or MDX.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Search">
          Every page goes into the search index when the site is built.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Dev server">
          Vite updates the page when you save a file.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="React components">
          Import your own components into MDX or TSX routes, like this counter: <Counter />
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
