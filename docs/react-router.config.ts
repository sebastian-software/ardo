import type { Config } from "@react-router/dev/config"

export default {
  // SPA Mode with Pre-Rendering
  ssr: false,

  // Automatically pre-render all static routes from routes.ts
  // Dynamic routes (e.g., /blog/:slug) are ignored
  prerender: true,

  // Base path for GitHub Pages deployment (must match Vite's base config)
  basename: "/ardo/",
} satisfies Config
