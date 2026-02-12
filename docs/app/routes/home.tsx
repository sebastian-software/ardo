import { Hero, Features } from "ardo/ui"
import { Link } from "react-router"
import {
  Atom,
  Zap,
  BookOpen,
  ShieldCheck,
  Palette,
  Search,
  Moon,
  FileCode,
  Rocket,
  Terminal,
  Github,
} from "ardo/icons"
import logo from "../assets/logo.svg"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
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
      <section className="ardo-home-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">From zero to docs in four lines</h2>
          <p className="ardo-home-section-subtitle">
            Scaffold a complete documentation site. Add an MDX file, see it in the sidebar.
          </p>

          <div className="ardo-home-terminal">
            <div className="ardo-home-terminal-header">
              <span className="ardo-home-terminal-dot" />
              <span className="ardo-home-terminal-dot" />
              <span className="ardo-home-terminal-dot" />
            </div>
            <div className="ardo-home-terminal-body">
              <code>
                <span className="ardo-home-terminal-prompt">$</span> pnpm create ardo@latest my-docs
                <br />
                <span className="ardo-home-terminal-prompt">$</span> cd my-docs && pnpm install
                <br />
                <span className="ardo-home-terminal-prompt">$</span> pnpm dev
                <br />
                <br />
                <span className="ardo-home-terminal-success">✓</span> Server running at{" "}
                <span className="ardo-home-terminal-link">http://localhost:5173</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <Features
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
            title: "Make it yours",
            icon: <Palette size={28} strokeWidth={1.5} />,
            details:
              "CSS custom properties for theming. Override any component. Bring your own layout if the defaults don't fit. It's your site.",
          },
        ]}
      />

      {/* Code Example Section */}
      <section className="ardo-home-section ardo-home-section-alt">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">
            Markdown when it's enough, React when it's not
          </h2>
          <p className="ardo-home-section-subtitle">
            Plain Markdown for content. Drop in a React component when you need something
            interactive.
          </p>

          <div className="ardo-home-code-example">
            <div className="ardo-home-code-block">
              <div className="ardo-home-code-header">
                <span>getting-started.mdx</span>
              </div>
              <pre className="ardo-home-code-content">
                <code>{`---
title: Getting Started
---

# Getting Started

Install Ardo with your favorite package manager:

\`\`\`bash
pnpm add ardo react react-dom
\`\`\`

:::tip
Use \`create-ardo\` for a complete project setup!
:::

<CustomAlert type="info">
  You can use **any React component** in your docs.
</CustomAlert>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="ardo-home-section ardo-home-section-alt">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Your stack, not ours</h2>
          <p className="ardo-home-section-subtitle">
            Ardo is built on the tools React teams already use. Nothing new to learn.
          </p>

          <div className="ardo-home-tech-grid">
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <Atom size={32} />
              </div>
              <span>React 19</span>
            </div>
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <Zap size={32} />
              </div>
              <span>Vite 8</span>
            </div>
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <FileCode size={32} />
              </div>
              <span>TypeScript</span>
            </div>
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <Rocket size={32} />
              </div>
              <span>React Router 7</span>
            </div>
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <BookOpen size={32} />
              </div>
              <span>MDX</span>
            </div>
            <div className="ardo-home-tech-item">
              <div className="ardo-home-tech-icon">
                <Terminal size={32} />
              </div>
              <span>Shiki</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="ardo-home-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">How Ardo compares</h2>
          <p className="ardo-home-section-subtitle">
            Great tools exist. The question is whether they fit your stack.
          </p>

          <div className="ardo-home-comparison">
            <table className="ardo-home-comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="ardo-home-comparison-highlight">Ardo</th>
                  <th>Docusaurus</th>
                  <th>Starlight</th>
                  <th>VitePress</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UI framework</td>
                  <td className="ardo-home-comparison-highlight">React 19</td>
                  <td>React</td>
                  <td>Astro</td>
                  <td>Vue</td>
                </tr>
                <tr>
                  <td>Build tool</td>
                  <td className="ardo-home-comparison-highlight">Vite 8</td>
                  <td>Webpack</td>
                  <td>Astro/Vite</td>
                  <td>Vite</td>
                </tr>
                <tr>
                  <td>Your React components</td>
                  <td className="ardo-home-comparison-highlight">
                    <span className="ardo-home-check">Native</span>
                  </td>
                  <td>
                    <span className="ardo-home-check">Native</span>
                  </td>
                  <td>Via islands</td>
                  <td>
                    <span className="ardo-home-x">No</span>
                  </td>
                </tr>
                <tr>
                  <td>TypeDoc built in</td>
                  <td className="ardo-home-comparison-highlight">
                    <span className="ardo-home-check">Yes</span>
                  </td>
                  <td>Plugin</td>
                  <td>Plugin</td>
                  <td>
                    <span className="ardo-home-x">No</span>
                  </td>
                </tr>
                <tr>
                  <td>First load</td>
                  <td className="ardo-home-comparison-highlight">~111 KB</td>
                  <td>~500 KB+</td>
                  <td>~50 KB</td>
                  <td>~50 KB</td>
                </tr>
                <tr>
                  <td>CO₂ per visit</td>
                  <td className="ardo-home-comparison-highlight">~0.04g (A)</td>
                  <td>~0.10g (B)</td>
                  <td>~0.01g (A+)</td>
                  <td>~0.04g (A)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ardo-home-comparison-cta">
            <Link to="/guide/comparison" className="ardo-home-link">
              Read the full comparison <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="ardo-home-section ardo-home-cta-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Ship your docs this week</h2>
          <p className="ardo-home-section-subtitle">
            Four lines in your terminal. A complete documentation site. What are you waiting for?
          </p>

          <div className="ardo-home-cta-buttons">
            <Link to="/guide/getting-started" className="ardo-home-cta-primary">
              <Rocket size={20} />
              Create your first project
            </Link>
            <a
              href="https://github.com/sebastian-software/ardo"
              className="ardo-home-cta-secondary"
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
