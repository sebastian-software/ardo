import { ArdoHero } from "ardo/ui"
import type { MetaFunction } from "ardo/router"

export const meta: MetaFunction = () => [{ title: "Three Sections" }]

export default function HomePage() {
  return (
    <ArdoHero
      name="Three Sections"
      text="Section tabs fixture"
      tagline="Three sections like Ferroni: guide, perf and adr."
      actions={[{ text: "Get Started", link: "/guide/getting-started", theme: "brand" }]}
    />
  )
}
