import type { Preview } from "@storybook/react"
import { CodeOrSourceMdx } from "@storybook/blocks"
import "../packages/ardo/src/ui/styles.css.ts"
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
    docs: {
      components: {
        code: CodeOrSourceMdx,
      },
    },
  },
}

export default preview
