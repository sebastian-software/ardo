import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search } from "./Search"

const meta = {
  title: "Utilities/Search",
  component: Search,
  tags: ["autodocs"],
} satisfies Meta<typeof Search>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
