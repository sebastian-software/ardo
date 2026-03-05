import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoSearch } from "./Search"

const meta = {
  component: ArdoSearch,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoSearch>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
