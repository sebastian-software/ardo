import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "Showcase | Ardo" },
  { name: "description", content: "Projects and documentation sites built with Ardo" },
]

export default function Showcase() {
  return (
    <div className="ardo-content">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
            Built with Ardo
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--ardo-c-text-light)",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Documentation sites and projects powered by Ardo. Yours could be next.
          </p>
        </div>

        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--ardo-c-bg-soft)",
            borderRadius: "var(--ardo-radius-lg)",
            border: "1px solid var(--ardo-c-border)",
          }}
        >
          <p style={{ fontSize: 16, color: "var(--ardo-c-text-lighter)", marginBottom: 24 }}>
            No projects listed yet. Yours could be the first!
          </p>
          <a
            href="https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/showcase.tsx"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              color: "white",
              background: "var(--ardo-c-brand)",
              borderRadius: "var(--ardo-radius)",
              textDecoration: "none",
            }}
          >
            Add your project
          </a>
        </div>
      </div>
    </div>
  )
}
