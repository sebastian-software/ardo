import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentType, SVGProps } from "react"

import * as content from "../content-icons"
import * as chrome from "./chrome"
import * as sections from "./sections"

type IconSet = Record<string, ComponentType<SVGProps<SVGSVGElement>>>

function IconGrid({ icons, sizes }: { icons: IconSet; sizes: number[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
        gap: "0.75rem",
      }}
    >
      {Object.entries(icons).map(([name, Icon]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {sizes.map((size) => (
            <Icon key={size} width={size} height={size} aria-hidden="true" />
          ))}
          <code>{name}</code>
        </div>
      ))}
    </div>
  )
}

const meta = {
  component: IconGrid,
  args: { icons: sections, sizes: [14, 28] },
} satisfies Meta<typeof IconGrid>

export default meta

type Story = StoryObj<typeof meta>

/** Section tab icons, at 14 px and doubled. */
export const Sections: Story = {}

/** Chrome icons at 14 px (header), 16 px (callouts) and doubled. */
export const Chrome: Story = {
  args: { icons: chrome, sizes: [14, 16, 28] },
}

/** Icons available to documentation authors, at 20 px and 28 px. */
export const Content: Story = {
  args: { icons: content, sizes: [20, 28] },
}
