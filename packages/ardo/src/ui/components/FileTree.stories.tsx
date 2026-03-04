import type { Meta, StoryObj } from "@storybook/react-vite"
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
    children: (
      <ul>
        <li>
          my-docs/
          <ul>
            <li>
              app/
              <ul>
                <li>
                  routes/
                  <ul>
                    <li>
                      guide/
                      <ul>
                        <li>getting-started.mdx</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>root.tsx</li>
              </ul>
            </li>
            <li>vite.config.ts</li>
          </ul>
        </li>
      </ul>
    ),
  },
}
