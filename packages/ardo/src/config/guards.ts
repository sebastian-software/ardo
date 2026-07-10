import type { ArdoConfig } from "./types"

export function isArdoConfig(value: unknown): value is ArdoConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string"
  )
}
