import { createFileRoute } from '@tanstack/react-router'
import { Hero, Features } from 'ardo/ui'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero
        name="{{SITE_TITLE}}"
        text="Documentation Made Simple"
        tagline="Focus on your content, not configuration"
        actions={[
          { text: 'Get Started', link: '/guide/getting-started', theme: 'brand' },
        ]}
      />

      <Features
        items={[
          {
            title: 'Zero Config',
            details: 'Just write markdown. No framework knowledge required.',
          },
          {
            title: 'Fast',
            details: 'Powered by Vite and React 19.',
          },
          {
            title: 'Beautiful',
            details: 'Clean design out of the box.',
          },
        ]}
      />
    </>
  )
}
