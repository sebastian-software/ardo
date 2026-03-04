import type { Meta, StoryObj } from "@storybook/react-vite"
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
    code: "pnpm storybook:build",
  },
}
