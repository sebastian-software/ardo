import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoMermaid } from "./Mermaid"

const meta = {
  title: "Components/Mermaid",
  component: ArdoMermaid,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ArdoMermaid>

export default meta

type Story = StoryObj<typeof meta>

export const Flowchart: Story = {
  args: {
    code: `graph TD
    A[Write docs] --> B{Need a diagram?}
    B -->|Yes| C[Add a mermaid fence]
    B -->|No| D[Ship it]
    C --> D`,
  },
}

export const SequenceDiagram: Story = {
  args: {
    code: `sequenceDiagram
    participant Browser
    participant Site as Docs Site
    Browser->>Site: Open page with diagram
    Site-->>Browser: HTML with diagram source
    Browser->>Browser: Lazy-load mermaid, render SVG`,
  },
}

export const InvalidSource: Story = {
  args: {
    code: "graph TD\n  A --> [unclosed",
  },
}
