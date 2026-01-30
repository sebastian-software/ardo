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
  ArrowRight,
  Check,
  X,
  Github,
} from "ardo/icons"
import logo from "../assets/logo.svg"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        name="Ardo"
        text="React-first Documentation"
        tagline="Build beautiful documentation sites with React, React Router, and Markdown. Automatically generate API references from TypeScript with built-in TypeDoc integration."
        image={logo}
        actions={[
          { text: "Get Started", link: "/guide/getting-started", theme: "brand" },
          {
            text: "View on GitHub",
            link: "https://github.com/sebastian-software/ardo",
            theme: "alt",
          },
        ]}
      />

      {/* Quick Start Section */}
      <section className="ardo-home-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Up and Running in Seconds</h2>
          <p className="ardo-home-section-subtitle">
            One command to scaffold a complete documentation site
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
        title="Everything You Need"
        subtitle="A complete toolkit for building world-class documentation"
        items={[
          {
            title: "React 19",
            icon: <Atom size={28} strokeWidth={1.5} />,
            details:
              "Built on the latest React with full support for Server Components, Suspense, and modern patterns.",
          },
          {
            title: "Vite + Rolldown",
            icon: <Zap size={28} strokeWidth={1.5} />,
            details:
              "Lightning-fast builds with Vite 8 and Rolldown. Instant HMR and optimized production bundles.",
          },
          {
            title: "TypeDoc Built-in",
            icon: <BookOpen size={28} strokeWidth={1.5} />,
            details:
              "Auto-generate API documentation from TypeScript source code. Zero configuration required.",
          },
          {
            title: "Type-Safe Routes",
            icon: <ShieldCheck size={28} strokeWidth={1.5} />,
            details:
              "Full TypeScript support with type-safe navigation. Catch broken links at build time.",
          },
          {
            title: "Dark Mode",
            icon: <Moon size={28} strokeWidth={1.5} />,
            details:
              "Beautiful light and dark themes with smooth transitions. Respects system preferences.",
          },
          {
            title: "Full-Text Search",
            icon: <Search size={28} strokeWidth={1.5} />,
            details:
              "Client-side search powered by MiniSearch. Works offline, no external services needed.",
          },
          {
            title: "MDX Support",
            icon: <FileCode size={28} strokeWidth={1.5} />,
            details:
              "Write Markdown with embedded React components. Syntax highlighting with Shiki.",
          },
          {
            title: "Customizable",
            icon: <Palette size={28} strokeWidth={1.5} />,
            details: "CSS variables for easy theming. Override any component. Make it truly yours.",
          },
        ]}
      />

      {/* Code Example Section */}
      <section className="ardo-home-section ardo-home-section-alt">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Write Docs, Not Boilerplate</h2>
          <p className="ardo-home-section-subtitle">
            Simple Markdown with the full power of React when you need it
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

      {/* Comparison Section */}
      <section className="ardo-home-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Why Ardo?</h2>
          <p className="ardo-home-section-subtitle">
            The only React-native documentation framework with built-in TypeDoc
          </p>

          <div className="ardo-home-comparison">
            <table className="ardo-home-comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="ardo-home-comparison-highlight">Ardo</th>
                  <th>VitePress</th>
                  <th>Docusaurus</th>
                  <th>Starlight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UI Framework</td>
                  <td className="ardo-home-comparison-highlight">
                    <strong>React 19</strong>
                  </td>
                  <td>Vue 3</td>
                  <td>React 18</td>
                  <td>Astro</td>
                </tr>
                <tr>
                  <td>Build Tool</td>
                  <td className="ardo-home-comparison-highlight">
                    <strong>Vite 8 + Rolldown</strong>
                  </td>
                  <td>Vite 5</td>
                  <td>Webpack</td>
                  <td>Vite 5</td>
                </tr>
                <tr>
                  <td>TypeDoc Built-in</td>
                  <td className="ardo-home-comparison-highlight">
                    <Check size={18} className="ardo-home-check" />
                  </td>
                  <td>
                    <X size={18} className="ardo-home-x" />
                  </td>
                  <td>Plugin</td>
                  <td>
                    <X size={18} className="ardo-home-x" />
                  </td>
                </tr>
                <tr>
                  <td>Type-Safe Routes</td>
                  <td className="ardo-home-comparison-highlight">
                    <Check size={18} className="ardo-home-check" />
                  </td>
                  <td>
                    <X size={18} className="ardo-home-x" />
                  </td>
                  <td>
                    <X size={18} className="ardo-home-x" />
                  </td>
                  <td>
                    <X size={18} className="ardo-home-x" />
                  </td>
                </tr>
                <tr>
                  <td>React Components in MD</td>
                  <td className="ardo-home-comparison-highlight">
                    <Check size={18} className="ardo-home-check" />
                  </td>
                  <td>Vue only</td>
                  <td>
                    <Check size={18} className="ardo-home-check" />
                  </td>
                  <td>
                    <Check size={18} className="ardo-home-check" />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="ardo-home-comparison-cta">
              <Link to="/guide/comparison" className="ardo-home-link">
                See full comparison <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="ardo-home-section ardo-home-section-alt">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Built on Modern Standards</h2>
          <p className="ardo-home-section-subtitle">
            Powered by the technologies you already know and love
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

      {/* Final CTA Section */}
      <section className="ardo-home-section ardo-home-cta-section">
        <div className="ardo-home-section-container">
          <h2 className="ardo-home-section-title">Ready to Build?</h2>
          <p className="ardo-home-section-subtitle">
            Start creating beautiful documentation in minutes, not hours
          </p>

          <div className="ardo-home-cta-buttons">
            <Link to="/guide/getting-started" className="ardo-home-cta-primary">
              <Rocket size={20} />
              Get Started
            </Link>
            <a
              href="https://github.com/sebastian-software/ardo"
              className="ardo-home-cta-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
