import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoCard, ArdoCardGroup } from "./Card"

const meta = {
  title: "Components/Card",
  component: ArdoCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ArdoCard>

export default meta

type Story = StoryObj<typeof meta>

export const Grid: Story = {
  args: { title: "Quick Start" },
  render: () => (
    <ArdoCardGroup cols={3}>
      <ArdoCard title="Quick Start" icon={<span>🚀</span>} href="/guide/getting-started">
        Get up and running with an Ardo documentation site.
      </ArdoCard>
      <ArdoCard title="Configuration" icon={<span>⚙️</span>} href="/guide/configuration">
        Learn how to configure navigation, theme, and integrations.
      </ArdoCard>
      <ArdoCard title="Markdown" icon={<span>📄</span>} href="/guide/markdown">
        Review the Markdown and MDX features supported by Ardo.
      </ArdoCard>
    </ArdoCardGroup>
  ),
}

export const Static: Story = {
  args: {
    title: "Composable content",
    icon: <span>🧱</span>,
    children: "Use cards as highlighted content blocks even without a link.",
  },
}
