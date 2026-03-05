import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoFooter } from "./Footer"

const meta = {
  component: ArdoFooter,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoFooter>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
