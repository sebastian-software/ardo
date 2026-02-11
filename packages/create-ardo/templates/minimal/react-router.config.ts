import type { Config } from "@react-router/dev/config"
{{GITHUB_PAGES_BASENAME_IMPORT}}

export default {
  ssr: false,
  prerender: true,
  {{GITHUB_PAGES_BASENAME}}
} satisfies Config
