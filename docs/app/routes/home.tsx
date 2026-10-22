import "@fontsource-variable/bricolage-grotesque/opsz.css"
import "@fontsource-variable/caveat"
import "@fontsource-variable/figtree"

import type { ArdoMetaDescriptor, ArdoMetaFunction } from "ardo/runtime"
import npmFacts from "virtual:docs/npm-facts"

import { CompanyCards, FinalCallToAction } from "../home/Closing"
import { ApiReference, Components, Theming } from "../home/Craft"
import { Engines } from "../home/Engines"
import { Hero, Teaser, ToolStrip } from "../home/Hero"
import * as styles from "../home/home.css"
import { useLiveNpmFacts } from "../home/npm-facts"
import { FitCheck, WhereArdoFits, WhyArdo } from "../home/Orientation"
import { AgentSetup, HowItWorks } from "../home/Story"
import socialCard from "../assets/social-card.png"

export const meta: ArdoMetaFunction = (): ArdoMetaDescriptor[] => [
  { title: "Ardo: React docs, baked into plain HTML" },
  {
    name: "description",
    content:
      "Ardo is a static site generator for React projects: guides, API reference and search, baked at build time by Rust engines and served as plain HTML.",
  },
  { tagName: "link", rel: "canonical", href: "https://ardo-docs.dev/v6/" },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "Ardo" },
  { property: "og:title", content: "Ardo: React docs, baked into plain HTML" },
  {
    property: "og:description",
    content: "Guides, TypeScript API reference, and your components. In one place.",
  },
  { property: "og:url", content: "https://ardo-docs.dev/v6/" },
  { property: "og:image", content: new URL(socialCard, "https://ardo-docs.dev").href },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  {
    property: "og:image:alt",
    content: "Ardo: React docs, baked into plain HTML, with Ardo's owl mascot.",
  },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Ardo: React docs, baked into plain HTML" },
  {
    name: "twitter:description",
    content: "Guides, TypeScript API reference, and your components. In one place.",
  },
  { name: "twitter:image", content: new URL(socialCard, "https://ardo-docs.dev").href },
]

export const handle = { layout: "bare" }

export default function HomePage() {
  // The build bakes in the npm facts of its deploy; the browser refreshes them.
  const facts = useLiveNpmFacts("ardo", npmFacts)

  return (
    <div className={styles.page}>
      <Hero facts={facts} />
      <ToolStrip />
      <Teaser />
      <HowItWorks />
      <AgentSetup />
      <Engines />
      <Components />
      <ApiReference />
      <Theming />
      <WhereArdoFits />
      <FitCheck />
      <WhyArdo />
      <FinalCallToAction />
      <CompanyCards facts={facts} />
    </div>
  )
}
