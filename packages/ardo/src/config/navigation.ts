import type { ArdoConfig } from "./types"

const speculationModes = new Set<unknown>([false, "prefetch", "prerender"])

export function validateNavigationConfig(config: ArdoConfig, errors: string[]): void {
  const navigation: unknown = config.navigation
  if (navigation === undefined) return
  if (typeof navigation !== "object" || navigation === null || Array.isArray(navigation)) {
    errors.push("navigation must be an object.")
    return
  }

  const { viewTransitions, speculation } = navigation as Record<string, unknown>
  if (viewTransitions !== undefined && typeof viewTransitions !== "boolean") {
    errors.push("navigation.viewTransitions must be true or false.")
  }
  if (speculation !== undefined && !speculationModes.has(speculation)) {
    errors.push('navigation.speculation must be false, "prefetch", or "prerender".')
  }
}
