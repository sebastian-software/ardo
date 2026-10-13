import type { ReactRouterConfig as Config } from "ardo/config"

import { withArdoVersioning } from "ardo/vite"

const config = {
  // SPA Mode with Pre-Rendering
  ssr: false,

  // Automatically pre-render all static routes from routes.ts
  // Dynamic routes (e.g., /blog/:slug) are ignored
  prerender: true,
} satisfies Config

export default withArdoVersioning(config, { basename: "/v6/" })
