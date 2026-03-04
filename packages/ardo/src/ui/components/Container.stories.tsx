import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tip } from "./Container"

const meta = {
  title: "Content/Container",
  component: Tip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Storybook tip",
    children: "Use controls to evaluate variants quickly.",
  },
}
