import { ArdoHero, ArdoFeatures, ArdoFeatureCard, ArdoCodeBlock } from "ardo/ui"
import { Link } from "react-router"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "Ardo — Modern, open documentation for React teams" },
  {
    name: "description",
    content:
      "Build static documentation with React 19, React Router 7, Vite, and MDX. Keep your components, your repo, and your docs pipeline under your control.",
  },
]
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
import logo from "../assets/logo.svg"
import * as styles from "./home.css"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <ArdoHero
        className={styles.homeHero}
        name="Ardo"
        text="Modern, open docs for React teams"
        tagline="VitePress-style simplicity without leaving React. Build static documentation with React Router, Vite, MDX, your own components, and TypeScript API reference generation."
        image={logo}
        actions={[
          { text: "Start your first project", link: "/guide/getting-started", theme: "brand" },
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
          <h2 className={styles.sectionTitle}>From zero to docs in four lines</h2>
          <p className={styles.sectionSubtitle}>
            Scaffold a complete static docs site. Add an MDX file, see it in navigation, deploy the
            output anywhere.
          </p>

          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
            </div>
            <div className={styles.terminalBody}>
              <code>
                <span className={styles.terminalPrompt}>$</span> pnpm create ardo@latest my-docs
                <br />
                <span className={styles.terminalPrompt}>$</span> cd my-docs && pnpm install
                <br />
                <span className={styles.terminalPrompt}>$</span> pnpm dev
                <br />
                <br />
                <span className={styles.terminalSuccess}>✓</span> Server running at{" "}
                <span className={styles.terminalLink}>http://localhost:5173</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <ArdoFeatures
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
          React Router 7 gives the docs the same route model React teams already know, with static
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
        <ArdoFeatureCard
          title="Vanilla Extract styling"
          icon={<Paintbrush size={28} strokeWidth={1.5} />}
        >
          All styles are type-safe Vanilla Extract. Import design tokens from ardo/theme, write your
          own .css.ts files, and override any component with full autocomplete.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Make it yours" icon={<Palette size={28} strokeWidth={1.5} />}>
          Override CSS variables, swap components, or build an entirely custom theme. Ardo exposes
          the runtime data; you decide how to render it.
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
                '---\ntitle: Getting Started\n---\n\n# Getting Started\n\nInstall Ardo with your favorite package manager:\n\n```bash\npnpm add ardo react react-dom\n```\n\n<Tip>\n  Use `create-ardo` for a complete project setup!\n</Tip>\n\n<CustomAlert type="info">\n  You can use **any React component** in your docs.\n</CustomAlert>'
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
              <span>React Router 7</span>
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
          <h2 className={styles.sectionTitle}>How Ardo compares</h2>
          <p className={styles.sectionSubtitle}>
            Great tools exist. The right choice depends on whether your docs should live inside your
            React stack.
          </p>

          <div className={styles.comparison}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th></th>
                  <th className={styles.comparisonHighlight}>Ardo</th>
                  <th>Docusaurus</th>
                  <th>Starlight</th>
                  <th>VitePress</th>
                  <th>Fumadocs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Best fit</td>
                  <td className={styles.comparisonHighlight}>React teams, static docs</td>
                  <td>Mature OSS docs</td>
                  <td>Content-heavy Astro docs</td>
                  <td>Vue docs</td>
                  <td>Composable React docs</td>
                </tr>
                <tr>
                  <td>UI framework</td>
                  <td className={styles.comparisonHighlight}>React 19</td>
                  <td>React</td>
                  <td>Astro</td>
                  <td>Vue</td>
                  <td>React</td>
                </tr>
                <tr>
                  <td>Build tool</td>
                  <td className={styles.comparisonHighlight}>Vite 8</td>
                  <td>Webpack</td>
                  <td>Astro/Vite</td>
                  <td>Vite</td>
                  <td>Framework-dependent</td>
                </tr>
                <tr>
                  <td>Styling</td>
                  <td className={styles.comparisonHighlight}>
                    <span className={styles.check}>Vanilla Extract</span>
                  </td>
                  <td>CSS Modules</td>
                  <td>Tailwind</td>
                  <td>PostCSS</td>
                  <td>Tailwind / custom</td>
                </tr>
                <tr>
                  <td>Your React components</td>
                  <td className={styles.comparisonHighlight}>
                    <span className={styles.check}>Native</span>
                  </td>
                  <td>
                    <span className={styles.check}>Native</span>
                  </td>
                  <td>Via islands</td>
                  <td>
                    <span className={styles.x}>No</span>
                  </td>
                  <td>
                    <span className={styles.check}>Native</span>
                  </td>
                </tr>
                <tr>
                  <td>TypeDoc built in</td>
                  <td className={styles.comparisonHighlight}>
                    <span className={styles.check}>Yes</span>
                  </td>
                  <td>Plugin</td>
                  <td>Plugin</td>
                  <td>
                    <span className={styles.x}>No</span>
                  </td>
                  <td>Type tables / OpenAPI</td>
                </tr>
                <tr>
                  <td>Measured first page</td>
                  <td className={styles.comparisonHighlight}>~155 KB gzip</td>
                  <td>~500 KB+</td>
                  <td>~50 KB</td>
                  <td>~50 KB</td>
                  <td>Depends on framework</td>
                </tr>
                <tr>
                  <td>Ownership model</td>
                  <td className={styles.comparisonHighlight}>Open source, self-hosted</td>
                  <td>Open source</td>
                  <td>Open source</td>
                  <td>Open source</td>
                  <td>Open source</td>
                </tr>
                <tr>
                  <td>Core tradeoff</td>
                  <td className={styles.comparisonHighlight}>React-native over lowest JS</td>
                  <td>Mature but heavier</td>
                  <td>Light, Astro-first</td>
                  <td>Light, Vue-first</td>
                  <td>Powerful, more composable</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.comparisonCta}>
            <Link to="/guide/comparison" className={styles.link}>
              Read the full comparison <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Ship your docs this week</h2>
          <p className={styles.sectionSubtitle}>
            Start with the default theme, keep your React components, and publish static output from
            your own repo.
          </p>

          <div className={styles.ctaButtons}>
            <Link to="/guide/getting-started" className={styles.ctaPrimary}>
              <Rocket size={20} />
              Create your first project
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
