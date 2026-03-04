import type { Meta, StoryObj } from "@storybook/react"
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "./Tabs"

const meta = {
  title: "Content/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <TabList>
          <Tab>pnpm</Tab>
          <Tab>npm</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <code>pnpm storybook</code>
          </TabPanel>
          <TabPanel>
            <code>npm run storybook</code>
          </TabPanel>
        </TabPanels>
      </>
    ),
  },
}
