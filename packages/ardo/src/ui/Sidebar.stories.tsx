import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoSidebar } from "./Sidebar"

const meta = {
  title: "Layout/Sidebar",
  component: ArdoSidebar,
  tags: ["autodocs"],
  parameters: {
    routerPath: "/guide/component-playground",
  },
} satisfies Meta<typeof ArdoSidebar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
