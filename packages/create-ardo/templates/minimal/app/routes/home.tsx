import { ArdoHero, ArdoFeatures, ArdoFeatureCard } from "ardo/ui"
import { Zap, Sparkles, Palette, ArrowRight, Github } from "ardo/icons"
import type { MetaFunction } from "react-router"

export const meta: MetaFunction = () => [
  { title: "{{SITE_TITLE}}" },
]

export default function HomePage() {
  return (
    <>
      <ArdoHero
        name="{{SITE_TITLE}}"
        text="Documentation Made Simple"
        tagline="Focus on your content, not configuration"
        actions={[
          {
            text: "Get Started",
            link: "/guide/getting-started",
            theme: "brand",
            icon: <ArrowRight size={16} />,
          },
          {
            text: "GitHub",
            link: "https://github.com",
            theme: "alt",
            icon: <Github size={16} />,
          },
        ]}
      />
      <ArdoFeatures>
        <ArdoFeatureCard title="Fast" icon={<Zap size={28} strokeWidth={1.5} />}>
          Lightning fast builds with Vite
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Simple" icon={<Sparkles size={28} strokeWidth={1.5} />}>
          Easy to set up and use
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Flexible" icon={<Palette size={28} strokeWidth={1.5} />}>
          Fully customizable theme
        </ArdoFeatureCard>
      </ArdoFeatures>
    </>
  )
}
