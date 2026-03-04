import type { Meta, StoryObj } from "@storybook/react-vite"
import { Steps } from "./Steps"

const meta = {
  title: "Content/Steps",
  component: Steps,
  tags: ["autodocs"],
} satisfies Meta<typeof Steps>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <ol>
        <li>Start Storybook locally.</li>
        <li>Review component states with your team.</li>
        <li>Ship UI changes confidently.</li>
      </ol>
    ),
  },
}
