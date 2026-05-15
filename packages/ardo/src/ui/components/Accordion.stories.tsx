import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

const meta = {
  title: "Components/Accordion",
  component: ArdoAccordion,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ArdoAccordion>

export default meta

type Story = StoryObj<typeof meta>

export const Group: Story = {
  args: {
    title: "How do I install Ardo?",
    children: "Run pnpm create ardo to scaffold a new project.",
  },
  render: () => (
    <ArdoAccordionGroup onlyOneOpen>
      <ArdoAccordion title="How do I install Ardo?" icon="⚡" defaultOpen>
        Run <code>pnpm create ardo</code> to scaffold a new project.
      </ArdoAccordion>
      <ArdoAccordion title="Can I use it with existing projects?" icon="🧩">
        Yes, Ardo can be added to an existing React Router project.
      </ArdoAccordion>
      <ArdoAccordion title="Does it support MDX?" icon="📝">
        Ardo renders Markdown and MDX content through the built-in MDX provider.
      </ArdoAccordion>
    </ArdoAccordionGroup>
  ),
}

export const Standalone: Story = {
  args: {
    title: "Standalone accordion",
    children: "Use a single accordion for optional details or compact help text.",
    defaultOpen: true,
  },
}
