import type { Meta, StoryObj } from "@storybook/react-vite"

import { createMemoryRouter, RouterProvider } from "react-router"

import { ArdoErrorBoundary, type ArdoErrorBoundaryProps } from "./ErrorBoundary"

function ErrorBoundaryPreview(args: ArdoErrorBoundaryProps) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <div />,
        errorElement: <ArdoErrorBoundary {...args} />,
        loader() {
          throw new Error("Storybook preview failure")
        },
      },
    ],
    { initialEntries: ["/"] }
  )

  return <RouterProvider router={router} />
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
