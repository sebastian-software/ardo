import { t } from "@palamedes/core/macro"
import { getI18n } from "@palamedes/runtime"
import "./runtime"

// Literal source messages let Palamedes extract and compile the shared UI copy.
const messages: Record<string, () => string> = {
  " on 50 real documents.": () => t` on 50 real documents.`,
  " on Ardo’s own API.": () => t` on Ardo’s own API.`,
  ", same HTML.": () => t`, same HTML.`,
  "2.6× faster than pulldown-cmark": () => t`2.6× faster than pulldown-cmark`,
  "4.7× faster than Shiki on WebAssembly": () => t`4.7× faster than Shiki on WebAssembly`,
  "4.3× faster than TypeDoc": () => t`4.3× faster than TypeDoc`,
  "A Rust-powered build too, on Rspack. Ardo builds on Vite and reads your TypeScript.": () =>
    t`A Rust-powered build too, on Rspack. Ardo builds on Vite and reads your TypeScript.`,
  "A generated API page for defineConfig": () => t`A generated API page for defineConfig`,
  "A great fit if": () => t`A great fit if`,
  "A hosted platform. Ardo is open source and lives in your repo.": () =>
    t`A hosted platform. Ardo is open source and lives in your repo.`,
  "API reference for TypeScript": () => t`API reference for TypeScript`,
  "API reference from TypeScript": () => t`API reference from TypeScript`,
  "Ardo callouts: note, tip, important and warning": () =>
    t`Ardo callouts: note, tip, important and warning`,
  "Ardo cards with icons, above the MDX that renders them": () =>
    t`Ardo cards with icons, above the MDX that renders them`,
  "Ardo is a static site generator for React projects. Guides in Markdown and MDX, an API reference read from your TypeScript, and search, all prerendered at build time by native engines.":
    () =>
      t`Ardo is a static site generator for React projects. Guides in Markdown and MDX, an API reference read from your TypeScript, and search, all prerendered at build time by native engines.`,
  "Ardo is open source by Sebastian Software, together with Ferromark, Ferriki and the rest of the family.":
    () =>
      t`Ardo is open source by Sebastian Software, together with Ferromark, Ferriki and the rest of the family.`,
  "Ardo's current API documentation guide, showing a typed configuration with its required tsconfig":
    () =>
      t`Ardo's current API documentation guide, showing a typed configuration with its required tsconfig`,
  "Ardo’s default": () => t`Ardo’s default`,
  "Bake it": () => t`Bake it`,
  "Bring local React components or an installed design-system package into MDX. Build landing pages and layouts in plain React, with Ardo's cards, tabs, steps, accordions and callouts around them.":
    () =>
      t`Bring local React components or an installed design-system package into MDX. Build landing pages and layouts in plain React, with Ardo's cards, tabs, steps, accordions and callouts around them.`,
  "Browse Ardo’s own API reference →": () => t`Browse Ardo’s own API reference →`,
  Changelog: () => t`Changelog`,
  "Claims you can check.": () => t`Claims you can check.`,
  "Content, config and theme go through code review.": () =>
    t`Content, config and theme go through code review.`,
  "Copied!": () => t`Copied!`,
  "Copy prompt": () => t`Copy prompt`,
  "Copy the setup prompt": () => t`Copy the setup prompt`,
  "Copying failed. Copy the prompt below manually.": () =>
    t`Copying failed. Copy the prompt below manually.`,
  "Dress it up in a few lines.": () => t`Dress it up in a few lines.`,
  "Every page is complete HTML. Search engines see everything, readers get the content on the first request, and any static host will do.":
    () =>
      t`Every page is complete HTML. Search engines see everything, readers get the content on the first request, and any static host will do.`,
  "Fast all the way down.": () => t`Fast all the way down.`,
  "From repo to website, no server to babysit.": () =>
    t`From repo to website, no server to babysit.`,
  "Get started": () => t`Get started`,
  "Is Ardo your kind of bird?": () => t`Is Ardo your kind of bird?`,
  "Know one of these? Then you almost know Ardo.": () =>
    t`Know one of these? Then you almost know Ardo.`,
  "Latest release": () => t`Latest release`,
  "Let your agent do the setup.": () => t`Let your agent do the setup.`,
  "Markdown and MDX guides": () => t`Markdown and MDX guides`,
  "Mature and Markdown-first, in Python. Ardo stays in the React toolchain.": () =>
    t`Mature and Markdown-first, in Python. Ardo stays in the React toolchain.`,
  "Maybe not if": () => t`Maybe not if`,
  "More open source →": () => t`More open source →`,
  "No account, no service to keep alive.": () => t`No account, no service to keep alive.`,
  "No starter template, no copy-paste marathon. Hand this sentence to your coding agent, in a fresh repo or one you already have. The link points it to Ardo’s official instructions. It adapts the tested example and tells you how typecheck, tests and build went. You review it like any other pull request.":
    () =>
      t`No starter template, no copy-paste marathon. Hand this sentence to your coding agent, in a fresh repo or one you already have. The link points it to Ardo’s official instructions. It adapts the tested example and tells you how typecheck, tests and build went. You review it like any other pull request.`,
  "One component model.": () => t`One component model.`,
  "One sentence for your agent, the official instructions, a tested example. You review the result like any other pull request.":
    () =>
      t`One sentence for your agent, the official instructions, a tested example. You review the result like any other pull request.`,
  "Open source · for React projects": () => t`Open source · for React projects`,
  "Our Markdown and MDX compiler. Pages go in, React components come out, with headings, table of contents and search data picked up on the way.":
    () =>
      t`Our Markdown and MDX compiler. Pages go in, React components come out, with headings, table of contents and search data picked up on the way.`,
  "Our syntax highlighter. Every code block gets its colors during the build, light and dark, so the browser has nothing left to do.":
    () =>
      t`Our syntax highlighter. Every code block gets its colors during the build, light and dark, so the browser has nothing left to do.`,
  "Pages and examples are React. No second UI framework.": () =>
    t`Pages and examples are React. No second UI framework.`,
  "Pick a brand, an accent and a neutral hue, and how saturated they should be. Ardo works out light and dark mode from there. Want more? Override any token or swap a component.":
    () =>
      t`Pick a brand, an accent and a neutral hue, and how saturated they should be. Ardo works out light and dark mode from there. Want more? Override any token or swap a component.`,
  "Point Ardo at your TypeScript entry points to generate reference pages with signatures, parameters and comments. They show up in search, too, and update on the next build.":
    () =>
      t`Point Ardo at your TypeScript entry points to generate reference pages with signatures, parameters and comments. They show up in search, too, and update on the next build.`,
  "Psst… a joy to write, a treat to read.": () => t`Psst… a joy to write, a treat to read.`,
  "Public feature status and published benchmarks.": () =>
    t`Public feature status and published benchmarks.`,
  "React and MDX too, on a newer foundation: Vite and native engines, with plain HTML pages.": () =>
    t`React and MDX too, on a newer foundation: Vite and native engines, with plain HTML pages.`,
  "React and MDX too, without Next.js. Plain static files come out.": () =>
    t`React and MDX too, without Next.js. Plain static files come out.`,
  "React and Vite too. Ardo adds an API reference from your TypeScript and native engines.": () =>
    t`React and Vite too. Ardo adds an API reference from your TypeScript and native engines.`,
  "React too, as a toolkit. Ardo is one complete setup with its own engines.": () =>
    t`React too, as a toolkit. Ardo is one complete setup with its own engines.`,
  "Read the docs": () => t`Read the docs`,
  "Read the full comparison →": () => t`Read the full comparison →`,
  "Ready to hatch your docs?": () => t`Ready to hatch your docs?`,
  "Rust engines compile your Markdown and color every code block, TypeScript 7 reads your types, and Vite bundles the rest. Search index, sitemap and llms.txt come out of the same oven.":
    () =>
      t`Rust engines compile your Markdown and color every code block, TypeScript 7 reads your types, and Vite bundles the rest. Search index, sitemap and llms.txt come out of the same oven.`,
  "Rust tooling that tidies up the compiled pages and maps your declarations.": () =>
    t`Rust tooling that tidies up the compiled pages and maps your declarations.`,
  "Sebastian Werner · creator and maintainer": () => t`Sebastian Werner · creator and maintainer`,
  "See every component →": () => t`See every component →`,
  "See the benchmark →": () => t`See the benchmark →`,
  "Serve it": () => t`Serve it`,
  "Set up Ardo in this repository following https://ardo-docs.dev/llms.txt.": () =>
    t`Set up Ardo in this repository following https://ardo-docs.dev/llms.txt.`,
  "Setup prompt": () => t`Setup prompt`,
  "Static and content-first too, with React as the page model, not an island.": () =>
    t`Static and content-first too, with React as the page model, not an island.`,
  "Static files, no platform.": () => t`Static files, no platform.`,
  "The dev server you already love. Save a file, watch the page update.": () =>
    t`The dev server you already love. Save a file, watch the page update.`,
  "Its native compiler reads your types, and Ardo turns your exports into pages: components with their props, hooks and types. TypeDoc, rethought for React.":
    () =>
      t`Its native compiler reads your types, and Ardo turns your exports into pages: components with their props, hooks and types. TypeDoc, rethought for React.`,
  "The same idea for Nuxt and Vue. Ardo is the React counterpart.": () =>
    t`The same idea for Nuxt and Vue. Ardo is the React counterpart.`,
  "The top of an Ardo guide page: section rail, sidebar, title and table of contents": () =>
    t`The top of an Ardo guide page: section rail, sidebar, title and table of contents`,
  "TypeScript, React and Rust consulting: integration, support and long-term maintenance from the people who build Ardo.":
    () =>
      t`TypeScript, React and Rust consulting: integration, support and long-term maintenance from the people who build Ardo.`,
  "Typed content collections": () => t`Typed content collections`,
  "View on GitHub": () => t`View on GitHub`,
  "Vite and Markdown too, with React instead of Vue.": () =>
    t`Vite and Markdown too, with React instead of Vue.`,
  "Work with us →": () => t`Work with us →`,
  "Write it": () => t`Write it`,
  "Your components are invited.": () => t`Your components are invited.`,
  "Your own components and layouts": () => t`Your own components and layouts`,
  "Your repo is the source.": () => t`Your repo is the source.`,
  "Your types, now with a website.": () => t`Your types, now with a website.`,
  ardo: () => t`ardo`,
  "ardo on npm": () => t`ardo on npm`,
  "blue · teal · slate": () => t`blue · teal · slate`,
  "both are part of Ferramenta, our little family of Rust tools ↑": () =>
    t`both are part of Ferramenta, our little family of Rust tools ↑`,
  "components and layouts": () => t`components and layouts`,
  "dark mode included, for fellow night owls": () => t`dark mode included, for fellow night owls`,
  "docs should live in your repo and go through review": () =>
    t`docs should live in your repo and go through review`,
  "fit check": () => t`fit check`,
  "generated, not typed by hand": () => t`generated, not typed by hand`,
  "green · orange · warm gray": () => t`green · orange · warm gray`,
  "highlighted at build time": () => t`highlighted at build time`,
  "how it works": () => t`how it works`,
  "in good company:": () => t`in good company:`,
  "need a hand?": () => t`need a hand?`,
  "powered by": () => t`powered by`,
  "the easy way in": () => t`the easy way in`,
  "the owl says hi": () => t`the owl says hi`,
  theming: () => t`theming`,
  "under the hood": () => t`under the hood`,
  "where Ardo fits": () => t`where Ardo fits`,
  "whoo made this?": () => t`whoo made this?`,
  "yep, that’s the whole prompt. grab a coffee meanwhile.": () =>
    t`yep, that’s the whole prompt. grab a coffee meanwhile.`,
  "you need hosted editing and analytics (a hosted platform does that)": () =>
    t`you need hosted editing and analytics (a hosted platform does that)`,
  "you want prerendered pages and little work in the browser": () =>
    t`you want prerendered pages and little work in the browser`,
  "you want prose only, no React at all (try Starlight or VitePress)": () =>
    t`you want prose only, no React at all (try Starlight or VitePress)`,
  "your design system fits right in": () => t`your design system fits right in`,
  "your folders become this rail": () => t`your folders become this rail`,
  "your product or library is built with React and TypeScript": () =>
    t`your product or library is built with React and TypeScript`,
  "“I went looking for a modern, lightweight docs framework that was simply React. It didn’t exist. So I built it.”":
    () =>
      t`“I went looking for a modern, lightweight docs framework that was simply React. It didn’t exist. So I built it.”`,
  "← fresh from npm at every build": () => t`← fresh from npm at every build`,
}

export function text(source: string): string {
  const message = messages[source]
  if (message == null) throw new Error(`Unknown documentation UI message: ${source}`)
  return message()
}

export function localizedPath(path: string): string {
  return `/${getI18n().locale}${path}`
}
