import { Hero, Features } from "ardo/ui"
import { Zap, Sparkles, Palette, ArrowRight, Github } from "ardo/icons"

export default function HomePage() {
  return (
    <>
      <Hero
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
      <Features
        items={[
          {
            title: "Fast",
            icon: <Zap size={28} strokeWidth={1.5} />,
            details: "Lightning fast builds with Vite",
          },
          {
            title: "Simple",
            icon: <Sparkles size={28} strokeWidth={1.5} />,
            details: "Easy to set up and use",
          },
          {
            title: "Flexible",
            icon: <Palette size={28} strokeWidth={1.5} />,
            details: "Fully customizable theme",
          },
        ]}
      />
    </>
  )
}
