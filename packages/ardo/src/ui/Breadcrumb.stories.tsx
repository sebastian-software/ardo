import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoBreadcrumb } from "./Breadcrumb"

const meta = {
  component: ArdoBreadcrumb,
  tags: ["autodocs"],
  parameters: {
    routerPath: "/guide/component-playground",
  },
} satisfies Meta<typeof ArdoBreadcrumb>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
