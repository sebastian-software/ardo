import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "Showcase | Ardo" },
  {
    name: "description",
    content: "First-party examples and documentation sites built with Ardo.",
  },
]

const examples = [
  {
    title: "Basic docs site",
    description:
      "A small static documentation site that shows the default Ardo setup, React Router shell, Tailwind layer, and deployment-ready build output.",
    href: "https://github.com/sebastian-software/ardo/tree/main/examples/basic",
    label: "Open example",
  },
  {
    title: "Library documentation",
    description:
      "A React library docs setup with generated TypeScript API reference pages. Use this shape when your users need both guides and exported types.",
    href: "https://github.com/sebastian-software/ardo/tree/main/examples/library",
    label: "Open example",
  },
  {
    title: "Monorepo documentation",
    description:
      "A workspace-oriented setup for teams that keep packages and docs together. Useful when documentation should build from the same repository as the code.",
    href: "https://github.com/sebastian-software/ardo/tree/main/examples/monorepo",
    label: "Open example",
  },
]

export default function Showcase() {
  return (
    <div className="ardo-content">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
            Built with Ardo
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--ardo-color-textLight)",
              maxWidth: 640,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Ardo is used to build its own documentation and ships with first-party examples for the
            most common starting points: a basic docs site, a TypeScript library, and a monorepo.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            marginBottom: 40,
          }}
        >
          {examples.map((example) => (
            <article
              key={example.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 24,
                background: "var(--ardo-color-bg)",
                border: "1px solid var(--ardo-color-border)",
                borderRadius: "var(--ardo-radius-base)",
                boxShadow: "var(--ardo-color-shadowSm)",
              }}
            >
              <h2 style={{ fontSize: 20, margin: 0 }}>{example.title}</h2>
              <p style={{ color: "var(--ardo-color-textLight)", lineHeight: 1.6, margin: 0 }}>
                {example.description}
              </p>
              <a
                href={example.href}
                style={{
                  marginTop: "auto",
                  color: "var(--ardo-color-brand)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {example.label} <span aria-hidden="true">-&gt;</span>
              </a>
            </article>
          ))}
        </div>

        <div
          style={{
            padding: "24px",
            background: "var(--ardo-color-bgSoft)",
            borderRadius: "var(--ardo-radius-base)",
            border: "1px solid var(--ardo-color-border)",
          }}
        >
          <p style={{ color: "var(--ardo-color-textLight)", margin: 0 }}>
            Building public docs with Ardo? Open a pull request and add your project to this page.
            The useful proof is simple: what you built, why Ardo fit, and where readers can see it.
          </p>
        </div>
      </div>
    </div>
  )
}
