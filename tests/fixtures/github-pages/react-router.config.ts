import type { ReactRouterConfig } from "ardo/config"
import { withArdoGitHubPages } from "ardo/vite"

const config = {
  ssr: false,
  prerender: true,
} satisfies ReactRouterConfig

export default withArdoGitHubPages(config, { basename: "/ardo/" })
