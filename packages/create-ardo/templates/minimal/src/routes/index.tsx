import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from 'ardo/theme'
import { PressProvider } from 'ardo/runtime'
import config from 'virtual:ardo/config'
import sidebar from 'virtual:ardo/sidebar'
import { frontmatter, toc } from '../../content/index.md'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: (frontmatter.title as string)
          ? `${frontmatter.title} | ${config.title}`
          : config.title,
      },
      ...(frontmatter.description
        ? [{ name: 'description', content: frontmatter.description as string }]
        : []),
    ],
  }),
  component: HomeComponent,
})

function HomeComponent() {
  const pageData = {
    title: (frontmatter.title as string) || 'Home',
    description: frontmatter.description as string | undefined,
    frontmatter,
    toc,
    filePath: 'index.md',
    relativePath: 'index.md',
  }

  return (
    <PressProvider config={config} sidebar={sidebar} currentPage={pageData}>
      <HomePage />
    </PressProvider>
  )
}
