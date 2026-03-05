import type { Meta, StoryObj } from "@storybook/react-vite"

import { ardoContent } from "./content.css"
import { ArdoFooter } from "./Footer"
import { ArdoHeader } from "./Header"
import { ArdoLayout } from "./Layout"
import { ArdoSidebar } from "./Sidebar"

const meta = {
  component: ArdoLayout,
  tags: ["autodocs"],
  parameters: {
    routerPath: "/guide/getting-started",
  },
} satisfies Meta<typeof ArdoLayout>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    header: <ArdoHeader />,
    sidebar: <ArdoSidebar />,
    footer: <ArdoFooter />,
    children: (
      <article className={ardoContent} style={{ padding: "2rem" }}>
        <h1>Getting Started</h1>
        <p>Use this story to validate shell spacing and responsive behavior.</p>
      </article>
    ),
  },
}
