import type { Meta, StoryObj } from "@storybook/react"
import { FileTree } from "./FileTree"

const meta = {
  title: "Content/FileTree",
  component: FileTree,
  tags: ["autodocs"],
} satisfies Meta<typeof FileTree>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: `my-docs/
├── app/
│   ├── routes/
│   │   └── guide/
│   │       └── getting-started.mdx
│   └── root.tsx
└── vite.config.ts`,
  },
}
