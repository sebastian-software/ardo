import { ArdoHero, ArdoFeatures, ArdoCodeBlock } from "ardo/ui"
import { Link } from "react-router"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "Ardo — Documentation for React teams" },
  {
    name: "description",
    content:
      "Build documentation with React 19, React Router 7, and MDX. Drop in your existing components and generate API references straight from TypeScript.",
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
        name="Ardo"
        text="Documentation for React teams"
        tagline="Your components. Your stack. Your docs. Build documentation with React 19, React Router 7, and MDX. Drop in your existing components and generate API references straight from TypeScript."
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
      <section className={styles.section}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>From zero to docs in four lines</h2>
          <p className={styles.sectionSubtitle}>
            Scaffold a complete documentation site. Add an MDX file, see it in the sidebar.
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
        subtitle="Everything a documentation site needs, nothing it doesn't"
        items={[
          {
            title: "React 19, natively",
            icon: <Atom size={28} strokeWidth={1.5} />,
            details:
              "Not a React compatibility layer on top of something else. Actual React 19 with Server Components, Suspense, and the patterns you already use in your app.",
          },
          {
            title: "Vite 8 with Rolldown",
            icon: <Zap size={28} strokeWidth={1.5} />,
            details:
              "Dev server starts in under a second. HMR updates hit the browser before you look up from your editor. Production builds are just as fast.",
          },
          {
            title: "TypeDoc, zero config",
            icon: <BookOpen size={28} strokeWidth={1.5} />,
            details:
              "Point Ardo at your TypeScript source and it generates linked API reference pages. Interfaces, types, functions, classes. No plugins to install.",
          },
          {
            title: "Type-safe routes",
            icon: <ShieldCheck size={28} strokeWidth={1.5} />,
            details:
              "React Router 7 gives you typed navigation. Link to a page that doesn't exist? TypeScript tells you at build time, not your users at runtime.",
          },
          {
            title: "Light and dark mode",
            icon: <Moon size={28} strokeWidth={1.5} />,
            details:
              "Both themes ship by default. Follows system preferences, togglable by the reader, smooth transitions. Covers code blocks too.",
          },
          {
            title: "Offline-capable search",
            icon: <Search size={28} strokeWidth={1.5} />,
            details:
              "Full-text search powered by MiniSearch. Runs entirely in the browser. No external service to configure, no API keys, works offline.",
          },
          {
            title: "MDX with Shiki",
            icon: <FileCode size={28} strokeWidth={1.5} />,
            details:
              "Write Markdown, import React components where you need them. Code blocks are syntax-highlighted at build time with Shiki. No client-side JS for highlighting.",
          },
          {
            title: "Vanilla Extract styling",
            icon: <Paintbrush size={28} strokeWidth={1.5} />,
            details:
              "All styles are type-safe Vanilla Extract. Import design tokens from ardo/theme, write your own .css.ts files, and override any component — with full autocomplete.",
          },
          {
            title: "Make it yours",
            icon: <Palette size={28} strokeWidth={1.5} />,
            details:
              "Override CSS variables, swap components, or build an entirely custom theme. Ardo's runtime hooks give you all the data — you decide how to render it.",
          },
        ]}
      />

      {/* Code Example Section */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Markdown when it's enough, React when it's not</h2>
          <p className={styles.sectionSubtitle}>
            Plain Markdown for content. Drop in a React component when you need something
            interactive.
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
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Your stack, not ours</h2>
          <p className={styles.sectionSubtitle}>
            Ardo is built on the tools React teams already use. Nothing new to learn.
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
      <section className={styles.section}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>How Ardo compares</h2>
          <p className={styles.sectionSubtitle}>
            Great tools exist. The question is whether they fit your stack.
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
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UI framework</td>
                  <td className={styles.comparisonHighlight}>React 19</td>
                  <td>React</td>
                  <td>Astro</td>
                  <td>Vue</td>
                </tr>
                <tr>
                  <td>Build tool</td>
                  <td className={styles.comparisonHighlight}>Vite 8</td>
                  <td>Webpack</td>
                  <td>Astro/Vite</td>
                  <td>Vite</td>
                </tr>
                <tr>
                  <td>Styling</td>
                  <td className={styles.comparisonHighlight}>
                    <span className={styles.check}>Vanilla Extract</span>
                  </td>
                  <td>CSS Modules</td>
                  <td>Tailwind</td>
                  <td>PostCSS</td>
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
                </tr>
                <tr>
                  <td>First load</td>
                  <td className={styles.comparisonHighlight}>~111 KB</td>
                  <td>~500 KB+</td>
                  <td>~50 KB</td>
                  <td>~50 KB</td>
                </tr>
                <tr>
                  <td>CO₂ per visit</td>
                  <td className={styles.comparisonHighlight}>~0.04g (A)</td>
                  <td>~0.10g (B)</td>
                  <td>~0.01g (A+)</td>
                  <td>~0.04g (A)</td>
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
            Four lines in your terminal. A complete documentation site. What are you waiting for?
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
