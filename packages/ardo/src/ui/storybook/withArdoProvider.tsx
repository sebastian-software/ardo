import type { Decorator } from "@storybook/react"

import { MemoryRouter } from "react-router"

import type { ArdoConfig, PageData, SidebarItem } from "../../config/types"

import { ArdoProvider } from "../../runtime"

const storybookConfig: ArdoConfig = {
  title: "Ardo UI",
  description: "Storybook preview for internal Ardo components.",
  lang: "en",
  buildHash: "storybook",
  buildTime: "2026-01-01T00:00:00.000Z",
  project: {
    name: "ardo",
    version: "dev",
    homepage: "https://ardo-docs.dev",
  },
}

const sidebar: SidebarItem[] = [
  {
    text: "Guide",
    items: [
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "Component Playground", link: "/guide/component-playground" },
    ],
  },
  {
    text: "API",
    items: [{ text: "Overview", link: "/api-reference" }],
  },
]

const currentPage: PageData = {
  title: "Component Playground",
  description: "Interactive Ardo component workbench",
  frontmatter: {
    title: "Component Playground",
    description: "Storybook entry point",
  },
  content: "",
  filePath: "docs/app/routes/guide/component-playground.mdx",
  relativePath: "guide/component-playground.mdx",
  toc: [
    { id: "overview", text: "Overview", level: 2 },
    {
      id: "baseline-components",
      text: "Baseline components",
      level: 2,
      children: [{ id: "interactive", text: "Interactive", level: 3 }],
    },
  ],
}

export const withArdoProvider: Decorator = (Story, context) => {
  const path = context.parameters?.routerPath ?? "/guide/component-playground"

  return (
    <MemoryRouter initialEntries={[path]}>
      <ArdoProvider config={storybookConfig} sidebar={sidebar} currentPage={currentPage}>
        <Story />
      </ArdoProvider>
    </MemoryRouter>
  )
}
