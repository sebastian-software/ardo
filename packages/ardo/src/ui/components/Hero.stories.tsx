import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArdoHero } from "./Hero"

const meta = {
  title: "Content/Hero",
  component: ArdoHero,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoHero>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: "Ardo",
    text: "Component Playground",
    tagline: "Build and review internal UI components in isolation.",
    actions: [
      { text: "Open Guide", link: "/guide/component-playground", theme: "brand" },
      { text: "GitHub", link: "https://github.com/sebastian-software/ardo", theme: "alt" },
    ],
  },
}
