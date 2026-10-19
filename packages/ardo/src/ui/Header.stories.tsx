import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoHeader } from "./Header"
import { ArdoLayoutVariantContext } from "./layout-context"
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
    children: (
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

/** Docs layout: the search field sits at the viewport center. */
export const DocsSearchField: Story = {
  args: {
    title: "Ardo",
    search: "auto",
  },
}

/**
 * Bare (marketing) layout: search collapses to an icon with a ⌘K tooltip,
 * and the header shares the page frame with the hero and footer.
 */
export const BarePageSearchIcon: Story = {
  args: {
    title: "Ardo",
    search: "auto",
    children: (
      <ArdoNav>
        <ArdoNavLink to="/guide">Guide</ArdoNavLink>
        <ArdoNavLink to="/api">API</ArdoNavLink>
      </ArdoNav>
    ),
  },
  decorators: [
    (Story) => (
      <ArdoLayoutVariantContext value="bare">
        <Story />
      </ArdoLayoutVariantContext>
    ),
  ],
}

/** Explicit `search="icon"` keeps the icon on docs pages too. */
export const ForcedSearchIcon: Story = {
  args: {
    title: "Ardo",
    search: "icon",
  },
}
