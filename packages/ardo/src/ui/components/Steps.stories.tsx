import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoSteps } from "./Steps"

const meta = {
  component: ArdoSteps,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoSteps>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <ol>
        <li>Install `ardo` and the React Router integration.</li>
        <li>Wire the plugin into your Vite config.</li>
        <li>Start the dev server and write your first docs page.</li>
      </ol>
    ),
  },
}
