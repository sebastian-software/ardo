import type { Meta, StoryObj } from "@storybook/react"
import { Tip } from "./Container"

const meta = {
  title: "Content/Container",
  component: Tip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Tip title="Storybook tip">Use controls to evaluate variants quickly.</Tip>,
}
