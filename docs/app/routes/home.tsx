import { Hero, Features } from "ardo/ui"
import { Atom, Zap, BookOpen, ShieldCheck } from "ardo/icons"
import logo from "../assets/logo.svg"

export default function HomePage() {
  return (
    <>
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

      <Features
        items={[
          {
            title: "React-First",
            icon: <Atom size={28} strokeWidth={2} />,
            details:
              "Built on React Router and React. Use React components directly in your markdown.",
          },
          {
            title: "Lightning Fast",
            icon: <Zap size={28} strokeWidth={2} />,
            details:
              "Powered by Vite. Instant server start, lightning-fast HMR, and optimized builds.",
          },
          {
            title: "TypeDoc Integration",
            icon: <BookOpen size={28} strokeWidth={2} />,
            details:
              "Auto-generate API documentation from your TypeScript source code with zero configuration.",
          },
          {
            title: "Type-Safe",
            icon: <ShieldCheck size={28} strokeWidth={2} />,
            details:
              "Written in TypeScript with full type definitions. Get great DX with autocomplete.",
          },
        ]}
      />
    </>
  )
}
