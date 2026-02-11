import type { Config } from "@react-router/dev/config"
import { detectGitHubBasename } from "ardo/vite"

export default {
  // SPA Mode with Pre-Rendering
  ssr: false,

  // Automatically pre-render all static routes from routes.ts
  // Dynamic routes (e.g., /blog/:slug) are ignored
  prerender: true,

  // Auto-detect basename from GitHub remote for client-side routing
  // Build output is automatically flattened by the ardo plugin
  basename: detectGitHubBasename(),
} satisfies Config
