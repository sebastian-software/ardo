import type { Meta, StoryObj } from "@storybook/react"
import { CopyButton } from "./CopyButton"

const meta = {
  title: "Utilities/CopyButton",
  component: CopyButton,
  tags: ["autodocs"],
} satisfies Meta<typeof CopyButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: "pnpm storybook:build",
  },
}
