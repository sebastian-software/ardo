import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArdoNav, ArdoNavLink } from "./Nav"

const meta = {
  title: "Layout/Nav",
  component: ArdoNav,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoNav>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ArdoNav>
      <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
      <ArdoNavLink to="/api-reference">API</ArdoNavLink>
      <ArdoNavLink href="https://github.com/sebastian-software/ardo">GitHub</ArdoNavLink>
    </ArdoNav>
  ),
}
