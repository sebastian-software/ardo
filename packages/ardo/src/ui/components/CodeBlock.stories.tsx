import type { Meta, StoryObj } from "@storybook/react-vite"
import { CodeBlock } from "./CodeBlock"

const meta = {
  title: "Utilities/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
} satisfies Meta<typeof CodeBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    language: "bash",
    title: "terminal",
    code: "pnpm install\npnpm storybook\npnpm storybook:build",
  },
}
