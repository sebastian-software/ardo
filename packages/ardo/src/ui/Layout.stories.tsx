import type { Meta, StoryObj } from "@storybook/react"
import { Layout } from "./Layout"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Footer } from "./Footer"

const meta = {
  title: "Layout/Layout",
  component: Layout,
  tags: ["autodocs"],
  parameters: {
    routerPath: "/guide/getting-started",
  },
} satisfies Meta<typeof Layout>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Layout header={<Header />} sidebar={<Sidebar />} footer={<Footer />}>
      <article className="ardo-content" style={{ padding: "2rem" }}>
        <h1>Getting Started</h1>
        <p>Use this story to validate shell spacing and responsive behavior.</p>
      </article>
    </Layout>
  ),
}
