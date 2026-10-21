import type { Meta, StoryObj } from "@storybook/react-vite"

import { ArdoPageProvider } from "../runtime/page"
import { ArdoErrorBoundary, type ArdoErrorBoundaryProps } from "./ErrorBoundary"

function ErrorBoundaryPreview(args: ArdoErrorBoundaryProps) {
  return (
    <ArdoPageProvider error={new Error("Storybook preview failure")}>
      <ArdoErrorBoundary {...args} />
    </ArdoPageProvider>
  )
}

const meta = {
  component: ArdoErrorBoundary,
  tags: ["autodocs"],
  parameters: {
    ardoProvider: false,
    layout: "fullscreen",
  },
} satisfies Meta<typeof ArdoErrorBoundary>

export default meta

type Story = StoryObj<typeof meta>

export const GenericError: Story = {
  args: {
    error: {
      title: "Preview error",
      description: "Storybook renders the default error boundary chrome.",
      homeLabel: "Return home",
      homeHref: "/",
    },
  },
  render: (args) => <ErrorBoundaryPreview {...args} />,
}
