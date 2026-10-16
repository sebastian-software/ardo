import "@fontsource-variable/bricolage-grotesque/opsz.css"
import "@fontsource-variable/caveat"
import "@fontsource-variable/figtree"

import { type MetaFunction, useLoaderData } from "react-router"

import { CompanyCards, FinalCallToAction } from "../home/Closing"
import { ApiReference, Components, Theming } from "../home/Craft"
import { Engines } from "../home/Engines"
import { Hero, Teaser, ToolStrip } from "../home/Hero"
import * as styles from "../home/home.css"
import { fetchNpmFacts, useLiveNpmFacts } from "../home/npm-facts"
import { FitCheck, WhereArdoFits, WhyArdo } from "../home/Orientation"
import { AgentSetup, HowItWorks } from "../home/Story"

export const meta: MetaFunction = () => [
  { title: "Ardo: docs that are a joy to write and a treat to read" },
  {
    name: "description",
    content:
      "Ardo is a static site generator for React projects: guides, API reference and search, baked at build time by Rust engines and served as plain HTML.",
  },
]

export const handle = { layout: "bare" }

/**
 * Runs when the site is built, so the prerendered page carries the npm facts
 * of its deploy. The page refreshes them in the browser afterwards.
 */
export async function loader() {
  return { npm: await fetchNpmFacts("ardo") }
}

export default function HomePage() {
  const { npm } = useLoaderData<typeof loader>()
  const facts = useLiveNpmFacts("ardo", npm)

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
