import type { Meta, StoryObj } from "@storybook/react-vite"
import { Nav, NavLink } from "./Nav"

const meta = {
  title: "Layout/Nav",
  component: Nav,
  tags: ["autodocs"],
} satisfies Meta<typeof Nav>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Nav>
      <NavLink to="/guide/getting-started">Guide</NavLink>
      <NavLink to="/api-reference">API</NavLink>
      <NavLink href="https://github.com/sebastian-software/ardo">GitHub</NavLink>
    </Nav>
  ),
}
