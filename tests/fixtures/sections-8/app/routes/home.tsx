import { ArdoHero } from "ardo/ui"
import type { ArdoMetaFunction } from "ardo/runtime"

export const meta: ArdoMetaFunction = () => [{ title: "Eight Sections" }]

export default function HomePage() {
  return (
    <ArdoHero
      name="Eight Sections"
      text="Section tabs fixture"
      tagline="Eight sections, including one folder (notes) that the catalog does not know."
      actions={[{ text: "Get Started", link: "/guide/getting-started", theme: "brand" }]}
    />
  )
}
