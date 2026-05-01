import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoBadge } from "./Badge"

const meta = {
  component: ArdoBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Variants: Story = {
  args: {
    children: "New",
  },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      <ArdoBadge>New</ArdoBadge>
      <ArdoBadge variant="success">Stable</ArdoBadge>
      <ArdoBadge variant="warning">Beta</ArdoBadge>
      <ArdoBadge variant="danger">Deprecated</ArdoBadge>
      <ArdoBadge variant="info">v2.0+</ArdoBadge>
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    icon: "✨",
    children: "New",
  },
}
