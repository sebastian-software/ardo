import type { UserConfig } from "vite"

/** Fill unset Vite options without merging early project options a second time. */
export function createViteDefaults(userConfig: UserConfig, buildTime?: string): UserConfig {
  return {
    define:
      userConfig.define?.__BUILD_TIME__ === undefined
        ? { __BUILD_TIME__: JSON.stringify(buildTime ?? new Date().toISOString()) }
        : undefined,
    optimizeDeps: { exclude: ["ardo/ui/styles.css"] },
    server: {
      fs: {
        strict: userConfig.server?.fs?.strict ?? true,
        allow: [userConfig.root ?? process.cwd()],
      },
    },
    // Bundle components and their server renderer in the same dependency graph.
    ssr: { noExternal: true },
    // Transform CommonJS before the development SSR module runner loads dependencies.
    environments: {
      ssr: {
        optimizeDeps: {
          noDiscovery: userConfig.environments?.ssr?.optimizeDeps?.noDiscovery ?? false,
        },
      },
    },
  }
}
