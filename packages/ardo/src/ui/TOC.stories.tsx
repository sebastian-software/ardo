import type { Meta, StoryObj } from "@storybook/react-vite"
import { TOC } from "./TOC"

const meta = {
  title: "Layout/TOC",
  component: TOC,
  tags: ["autodocs"],
} satisfies Meta<typeof TOC>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: 480 }}>
      <main style={{ padding: "2rem" }}>
        <h2 id="overview">Overview</h2>
        <p>Heading anchors are available to test TOC active state behavior.</p>
        <h2 id="baseline-components">Baseline components</h2>
        <h3 id="interactive">Interactive</h3>
      </main>
      <TOC />
    </div>
  ),
}
