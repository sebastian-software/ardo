import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoCopyButton } from "./CopyButton"

const meta = {
  component: ArdoCopyButton,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoCopyButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    code: "pnpm storybook:build",
  },
}
