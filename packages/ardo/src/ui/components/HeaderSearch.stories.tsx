import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoHeaderSearch } from "./HeaderSearch"

const meta = {
  component: ArdoHeaderSearch,
  tags: ["autodocs"],
  parameters: {
    viewport: {
      defaultViewport: "responsive",
    },
  },
} satisfies Meta<typeof ArdoHeaderSearch>

export default meta

type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: {
    placeholder: "Search docs...",
  },
}

export const MobileOverlay: Story = {
  args: {
    placeholder: "Search docs...",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}
