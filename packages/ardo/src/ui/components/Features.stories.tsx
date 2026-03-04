import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArdoFeatures, ArdoFeatureCard } from "./Features"

const meta = {
  title: "Content/Features",
  component: ArdoFeatures,
  tags: ["autodocs"],
} satisfies Meta<typeof ArdoFeatures>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Baseline coverage",
    subtitle: "Core building blocks documented in Storybook.",
    children: (
      <>
        <ArdoFeatureCard title="Layout" icon="🧱">
          Header, sidebar, footer and navigation stories.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Content" icon="📄">
          Hero, features, tabs and structured docs helpers.
        </ArdoFeatureCard>
        <ArdoFeatureCard title="Utilities" icon="🛠️">
          Theme, search, copy and syntax highlighting.
        </ArdoFeatureCard>
      </>
    ),
  },
}
