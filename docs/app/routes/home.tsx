import { ArdoHero, ArdoFeatures, ArdoFeatureCard, ArdoCodeBlock, ArdoOwlMark } from "ardo/ui"
import { Link } from "react-router"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "Ardo: Modern, open documentation for React teams" },
  {
    name: "description",
    content:
      "Build static documentation with React 19, React Router 8, Vite, and MDX. Keep your components, your repo, and your docs pipeline under your control.",
  },
]

export const handle = { layout: "bare" }
import {
  Atom,
  Zap,
  BookOpen,
  ShieldCheck,
  Paintbrush,
  Palette,
  Search,
  Moon,
  FileCode,
  Rocket,
  Terminal,
  Github,
} from "ardo/icons"
import * as styles from "./home.css"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <ArdoHero
        className={styles.homeHero}
        name="Ardo"
        text="Docs that live in your React stack"
        tagline="Static documentation built on React Router, Vite, and MDX. Write guides with your own components, generate API reference from your TypeScript source, and deploy plain files anywhere."
        image={<ArdoOwlMark className={styles.heroOwl} title="Ardo" />}
        actions={[
          { text: "Adopt Ardo with your agent", link: "/guide/adopt-ardo", theme: "brand" },
          {
            text: "Browse on GitHub",
            link: "https://github.com/sebastian-software/ardo",
            theme: "alt",
          },
        ]}
      />

      {/* Quick Start Section */}
      <section className={`${styles.section} ${styles.quickStartSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Give your coding agent a real starting point</h2>
          <p className={styles.sectionSubtitle}>
            Start from the project you already have. Ardo&apos;s agent guide, llms.txt, and
            reference projects make the existing architecture the source of truth.
          </p>

          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
            </div>
            <div className={styles.terminalBody}>
              <code>
                <span className={styles.terminalPrompt}>$</span> Open https://ardo-docs.dev/llms.txt
                <br />
                <span className={styles.terminalPrompt}>$</span> Ask your agent to read the adoption
                guide
                <br />
                <span className={styles.terminalPrompt}>$</span> Choose the closest reference
                project
                <br />
                <br />
                <span className={styles.terminalSuccess}>✓</span> A focused plan for your repository
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Why Ardo exists */}
      <section className={styles.storySection}>
        <div className={styles.storyGrid}>
          <div>
            <blockquote className={styles.storyQuote}>
              &ldquo;I went looking for a modern, lightweight docs framework that was simply React.
              <em> It didn&rsquo;t exist.</em> So I built it.&rdquo;
            </blockquote>
            <div className={styles.storyAttribution}>
              <span className={styles.storyAvatar} aria-hidden="true">
                SW
              </span>
              <div>
                <div className={styles.storyName}>Sebastian Werner</div>
                <div className={styles.storyRole}>Creator and maintainer of Ardo</div>
              </div>
            </div>
          </div>
          <div className={styles.storyBody}>
            <p>
              Every option asked for a trade. <strong>VitePress</strong> is excellent, but
              it&rsquo;s Vue. <strong>Starlight</strong> is fast, but React components live behind
              Astro islands. <strong>Docusaurus</strong> is React, but carries years of webpack-era
              weight. Great tools, wrong fit for a team that already lives in React.
            </p>
            <p>
              Ardo is the tool I wanted that week: <strong>React Router and Vite</strong> doing what
              they already do best, MDX for writing, TypeDoc for API pages, and static files at the
              end. No second component model, no cloud platform, no sales call.
            </p>
            <p>
              It&rsquo;s open source and self-hosted. If your team builds in React, your docs can be
              part of the codebase instead of a separate product.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <ArdoFeatures
        className={styles.homeFeatures}
        title="What's in the box"
        subtitle="The defaults you need for serious docs, without taking ownership away from your codebase"
      >
        <ArdoFeatureCard title="React 19, natively" icon={<Atom size={28} strokeWidth={1.5} />}>
          Not a compatibility layer on top of another docs framework. Use React components, hooks,
          providers, and TypeScript the same way you use them in your app.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Vite 8 with Rolldown" icon={<Zap size={28} strokeWidth={1.5} />}>
          Modern Vite tooling keeps local docs work fast and predictable. Production output is
          static HTML and assets, ready for any host that serves files.
        </ArdoFeatureCard>
        <ArdoFeatureCard
          title="TypeDoc, zero config"
          icon={<BookOpen size={28} strokeWidth={1.5} />}
        >
          Point Ardo at your TypeScript source and generate linked API reference pages during the
          docs build. Interfaces, types, functions, and classes stay close to the code.
        </ArdoFeatureCard>
        <ArdoFeatureCard
          title="Type-safe routes"
          icon={<ShieldCheck size={28} strokeWidth={1.5} />}
        >
          React Router 8 gives the docs the same route model React teams already know, with static
          prerendering and a clean path to typed navigation.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Light and dark mode" icon={<Moon size={28} strokeWidth={1.5} />}>
          Both themes ship by default. Follows system preferences, togglable by the reader, smooth
          transitions. Covers code blocks too.
        </ArdoFeatureCard>
        <ArdoFeatureCard
          title="Offline-capable search"
          icon={<Search size={28} strokeWidth={1.5} />}
        >
          Full-text search powered by MiniSearch. Runs entirely in the browser. No external service
          to configure, no API keys, works offline.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="MDX with Shiki" icon={<FileCode size={28} strokeWidth={1.5} />}>
          Write Markdown, import React components where you need them. Code blocks are
          syntax-highlighted at build time with Shiki. No client-side JS for highlighting.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Make it yours" icon={<Palette size={28} strokeWidth={1.5} />}>
          Type-safe theming with Vanilla Extract: set your brand hues in one line, override any
          token, swap components, or build a fully custom theme with autocomplete all the way.
        </ArdoFeatureCard>
      </ArdoFeatures>

      {/* Code Example Section */}
      <section className={`${styles.section} ${styles.sectionAlt} ${styles.mdxSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Markdown when it's enough, React when it's not</h2>
          <p className={styles.sectionSubtitle}>
            Keep prose simple. Drop into real React when a guide needs your design system, a live
            example, or a custom workflow.
          </p>

          <div className={styles.codeExample}>
            <ArdoCodeBlock
              language="mdx"
              title="getting-started.mdx"
              code={
                '---\ntitle: Getting Started\n---\n\n# Getting Started\n\nInstall Ardo with your favorite package manager:\n\n```bash\npnpm add ardo react react-dom\n```\n\n<Tip>\n  Start from the reference project closest to your repository.\n</Tip>\n\n<CustomAlert type="info">\n  You can use **any React component** in your docs.\n</CustomAlert>'
              }
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className={`${styles.section} ${styles.stackSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Your stack, not ours</h2>
          <p className={styles.sectionSubtitle}>
            Ardo is built on tools React teams already use. No closed platform, no second UI
            framework, no docs-only component model.
          </p>

          <div className={styles.techGrid}>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <Atom size={32} />
              </div>
              <span>React 19</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <Zap size={32} />
              </div>
              <span>Vite 8</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <FileCode size={32} />
              </div>
              <span>TypeScript</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <Rocket size={32} />
              </div>
              <span>React Router 8</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <BookOpen size={32} />
              </div>
              <span>MDX</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <Terminal size={32} />
              </div>
              <span>Shiki</span>
            </div>
            <div className={styles.techItem}>
              <div className={styles.techIcon}>
                <Paintbrush size={32} />
              </div>
              <span>Vanilla Extract</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className={`${styles.section} ${styles.comparisonSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Where Ardo fits</h2>
          <p className={styles.sectionSubtitle}>
            Every one of these is a good tool. The only question is whether your docs belong inside
            your React stack.
          </p>

          <ul className={styles.compareList}>
            <li className={`${styles.compareRow} ${styles.compareRowSelf}`}>
              <div className={styles.compareName}>
                Ardo <span className={styles.compareTag}>React + Vite</span>
              </div>
              <p className={styles.compareNote}>
                Your React components, TypeDoc API pages, and static output. No platform, no second
                UI model.
              </p>
            </li>
            <li className={styles.compareRow}>
              <div className={styles.compareName}>
                VitePress <span className={styles.compareTag}>Vue</span>
              </div>
              <p className={styles.compareNote}>
                Light and excellent for Markdown docs. The moment you want an interactive example,
                the component layer is Vue.
              </p>
            </li>
            <li className={styles.compareRow}>
              <div className={styles.compareName}>
                Starlight <span className={styles.compareTag}>Astro</span>
              </div>
              <p className={styles.compareNote}>
                Fast and content-first. React works, but only through Astro islands rather than as
                the native model.
              </p>
            </li>
            <li className={styles.compareRow}>
              <div className={styles.compareName}>
                Docusaurus <span className={styles.compareTag}>React</span>
              </div>
              <p className={styles.compareNote}>
                The mature, batteries-included choice, and genuinely React, but it carries years of
                webpack-era weight.
              </p>
            </li>
            <li className={styles.compareRow}>
              <div className={styles.compareName}>
                Fumadocs <span className={styles.compareTag}>React</span>
              </div>
              <p className={styles.compareNote}>
                The closest in spirit: powerful and composable. It leans on Next.js, where Ardo
                stays on plain React Router and Vite.
              </p>
            </li>
          </ul>

          <div className={styles.comparisonCta}>
            <Link to="/guide/comparison" className={styles.link}>
              Read the full comparison <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className={`${styles.section} ${styles.examplesSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Choose your starting shape</h2>
          <p className={styles.sectionSubtitle}>
            First-party references for an agent or a team. Inspect the closest shape and adapt it to
            your repository instead of generating a generic project.
          </p>

          <div className={styles.examplesGrid}>
            <a
              className={styles.exampleCard}
              href="https://github.com/sebastian-software/ardo/tree/main/examples/basic"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className={styles.exampleTitle}>Basic docs site</h3>
              <p className={styles.exampleDescription}>
                A small static documentation site with the default Ardo setup, React Router shell,
                Tailwind layer, and deploy-ready build output.
              </p>
              <span className={styles.exampleLink}>
                Open example <span aria-hidden="true">→</span>
              </span>
            </a>
            <a
              className={styles.exampleCard}
              href="https://github.com/sebastian-software/ardo/tree/main/examples/library"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className={styles.exampleTitle}>Library documentation</h3>
              <p className={styles.exampleDescription}>
                A React library docs setup with generated TypeScript API reference pages. Use this
                shape when your users need both guides and exported types.
              </p>
              <span className={styles.exampleLink}>
                Open example <span aria-hidden="true">→</span>
              </span>
            </a>
            <a
              className={styles.exampleCard}
              href="https://github.com/sebastian-software/ardo/tree/main/examples/monorepo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className={styles.exampleTitle}>Monorepo documentation</h3>
              <p className={styles.exampleDescription}>
                A workspace-oriented setup for teams that keep packages and docs together. Useful
                when documentation should build from the same repository as the code.
              </p>
              <span className={styles.exampleLink}>
                Open example <span aria-hidden="true">→</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Ship docs that still feel like your product</h2>
          <p className={styles.sectionSubtitle}>
            Keep your React components and deployment choices. Let your agent make a small,
            reviewable change from the documentation your project can verify.
          </p>

          <div className={styles.ctaButtons}>
            <Link to="/guide/adopt-ardo" className={styles.ctaPrimary}>
              <Rocket size={20} />
              Start the agent-guided adoption
            </Link>
            <a
              href="https://github.com/sebastian-software/ardo"
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} />
              Browse on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
