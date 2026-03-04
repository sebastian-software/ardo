import type { Preview } from "@storybook/react"
import "../packages/ardo/src/ui/styles.css"
import { withArdoProvider } from "../packages/ardo/src/ui/storybook/withArdoProvider"

const preview: Preview = {
  decorators: [withArdoProvider],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
