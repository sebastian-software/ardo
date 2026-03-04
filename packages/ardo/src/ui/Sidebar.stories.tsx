import type { Meta, StoryObj } from "@storybook/react-vite"
import { Sidebar } from "./Sidebar"

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    routerPath: "/guide/component-playground",
  },
} satisfies Meta<typeof Sidebar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
