import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoTip } from "./Container"

const meta = {
  component: ArdoTip,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoTip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Storybook tip",
    children: "Use controls to evaluate variants quickly.",
  },
}
