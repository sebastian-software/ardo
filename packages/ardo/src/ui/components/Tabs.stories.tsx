import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "./Tabs"

const meta = {
  component: ArdoTabs,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoTabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <ArdoTabList>
          <ArdoTab>pnpm</ArdoTab>
          <ArdoTab>npm</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel>
            <code>pnpm storybook</code>
          </ArdoTabPanel>
          <ArdoTabPanel>
            <code>npm run storybook</code>
          </ArdoTabPanel>
        </ArdoTabPanels>
      </>
    ),
  },
}
