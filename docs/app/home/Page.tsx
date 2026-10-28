import "@fontsource-variable/bricolage-grotesque/opsz.css"
import "@fontsource-variable/caveat"
import "@fontsource-variable/figtree"

import { t } from "@palamedes/core/macro"
import { getI18n } from "@palamedes/runtime"

import type { ArdoMetaDescriptor, ArdoMetaFunction } from "ardo/runtime"
import npmFacts from "virtual:docs/npm-facts"

import { CompanyCards, FinalCallToAction } from "./Closing"
import { ApiReference, Components, Theming } from "./Craft"
import { Engines } from "./Engines"
import { Hero, Teaser, ToolStrip } from "./Hero"
import * as styles from "./home.css"
import { useLiveNpmFacts } from "./npm-facts"
import { FitCheck, WhereArdoFits, WhyArdo } from "./Orientation"
import { AgentSetup, HowItWorks } from "./Story"
import socialCard from "../assets/social-card.png"

export const meta: ArdoMetaFunction = (): ArdoMetaDescriptor[] => {
  const url = `https://ardo-docs.dev/v6/${getI18n().locale}/`
  return [
    { title: t`Ardo: React docs, baked into plain HTML` },
    {
      name: "description",
      content: t`Ardo is a static site generator for React projects: guides, API reference and search, baked at build time by native engines and served as plain HTML.`,
    },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Ardo" },
    { property: "og:title", content: t`Ardo: React docs, baked into plain HTML` },
    {
      property: "og:description",
      content: t`Guides, TypeScript API reference, and your components. In one place.`,
    },
    { property: "og:url", content: url },
    { property: "og:image", content: new URL(socialCard, "https://ardo-docs.dev").href },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: t`Ardo: React docs, baked into plain HTML, with Ardo's owl mascot.`,
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: t`Ardo: React docs, baked into plain HTML` },
    {
      name: "twitter:description",
      content: t`Guides, TypeScript API reference, and your components. In one place.`,
    },
    { name: "twitter:image", content: new URL(socialCard, "https://ardo-docs.dev").href },
  ]
}

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
