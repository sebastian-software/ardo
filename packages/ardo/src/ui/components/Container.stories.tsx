import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoContainer, type ArdoContainerType, ArdoTip } from "./Container"

const meta = {
  component: ArdoTip,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoTip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Storybook tip",
    children: "Use controls to evaluate variants quickly.",
  },
}

export const AllVariants: StoryObj = {
  render() {
    const variants: ArdoContainerType[] = ["tip", "info", "note", "warning", "danger"]

    return (
      <div style={{ display: "grid", gap: "1rem", maxWidth: "720px" }}>
        {variants.map((type) => (
          <ArdoContainer key={type} type={type} title={`${type} container`}>
            Container content stays readable across all callout variants.
          </ArdoContainer>
        ))}
      </div>
    )
  },
}
