import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArdoThemeToggle } from "./ThemeToggle"

const meta = {
  title: "Utilities/ThemeToggle",
  component: ArdoThemeToggle,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoThemeToggle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
