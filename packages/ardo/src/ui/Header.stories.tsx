import type { Meta, StoryObj } from "@storybook/react-vite"
import { Header } from "./Header"
import { Nav, NavLink } from "./Nav"

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
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
      <Nav>
        <NavLink to="/guide">Guide</NavLink>
        <NavLink to="/api">API</NavLink>
      </Nav>
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
