import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArdoCodeBlock } from "./CodeBlock"

const meta = {
  title: "Utilities/CodeBlock",
  component: ArdoCodeBlock,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoCodeBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    language: "bash",
    title: "terminal",
    code: "pnpm install\npnpm storybook\npnpm storybook:build",
  },
}
