import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoHeader } from "./Header"
import { ArdoNav, ArdoNavLink } from "./Nav"

// eslint-disable-next-line storybook/meta-satisfies-type -- explicit type annotation needed for TS portability
const meta: Meta<typeof ArdoHeader> = {
  component: ArdoHeader,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ minHeight: "80px", position: "relative" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithTitle: Story = {
  args: {
    title: "My Docs",
    search: false,
  },
}

export const WithNav: Story = {
  args: {
    title: "Ardo",
    search: false,
    nav: (
      <ArdoNav>
        <ArdoNavLink to="/guide">Guide</ArdoNavLink>
        <ArdoNavLink to="/api">API</ArdoNavLink>
      </ArdoNav>
    ),
  },
}

export const Minimal: Story = {
  args: {
    title: "Docs",
    search: false,
    themeToggle: false,
  },
}
