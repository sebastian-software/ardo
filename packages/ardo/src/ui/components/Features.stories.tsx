import type { Meta, StoryObj } from "@storybook/react"
import { Features } from "./Features"

const meta = {
  title: "Content/Features",
  component: Features,
  tags: ["autodocs"],
} satisfies Meta<typeof Features>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Baseline coverage",
    subtitle: "Core building blocks documented in Storybook.",
    items: [
      { title: "Layout", details: "Header, sidebar, footer and navigation stories.", icon: "🧱" },
      {
        title: "Content",
        details: "Hero, features, tabs and structured docs helpers.",
        icon: "📄",
      },
      { title: "Utilities", details: "Theme, search, copy and syntax highlighting.", icon: "🛠️" },
    ],
  },
}
