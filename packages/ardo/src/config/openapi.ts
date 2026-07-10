import path from "node:path"

import type { ArdoConfig } from "./types"

export function validateOpenApiConfig(config: ArdoConfig, errors: string[]): void {
  const openapi = config.openapi
  if (openapi == null) return

  if (openapi.spec.trim() === "") {
    errors.push("openapi.spec must be a non-empty local JSON or YAML file path.")
  }
  if (/^https?:\/\//iu.test(openapi.spec)) {
    errors.push("openapi.spec must be a local file path; remote URLs are unsupported.")
  }
  if (openapi.out != null && !isValidGeneratedRoutePrefix(openapi.out)) {
    errors.push("openapi.out must be a relative route prefix without dot segments.")
  }
}

function isValidGeneratedRoutePrefix(value: string): boolean {
  return (
    value.trim() !== "" &&
    !path.isAbsolute(value) &&
    value.split(/[\\/]/u).every((segment) => segment !== "." && segment !== "..")
  )
}
