const SCOPED_CONFIGS = [
  "react",
  "node",
  "vitest",
  "jest",
  "scripts",
  "config",
  "declarations",
] as const

/** Scoped configuration selected by the caller. */
export type ScopedConfig = (typeof SCOPED_CONFIGS)[number]
