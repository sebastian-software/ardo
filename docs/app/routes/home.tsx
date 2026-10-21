import "@fontsource-variable/bricolage-grotesque/opsz.css"
import "@fontsource-variable/caveat"
import "@fontsource-variable/figtree"

import type { ArdoMetaFunction } from "ardo/runtime"
import npmFacts from "virtual:docs/npm-facts"

import { CompanyCards, FinalCallToAction } from "../home/Closing"
import { ApiReference, Components, Theming } from "../home/Craft"
import { Engines } from "../home/Engines"
import { Hero, Teaser, ToolStrip } from "../home/Hero"
import * as styles from "../home/home.css"
import { useLiveNpmFacts } from "../home/npm-facts"
import { FitCheck, WhereArdoFits, WhyArdo } from "../home/Orientation"
import { AgentSetup, HowItWorks } from "../home/Story"

export const meta: ArdoMetaFunction = () => [
  { title: "Ardo: React docs, baked into plain HTML" },
  {
    name: "description",
    content:
      "Ardo is a static site generator for React projects: guides, API reference and search, baked at build time by Rust engines and served as plain HTML.",
  },
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
