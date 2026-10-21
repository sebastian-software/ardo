import { existsSync, readFileSync, writeFileSync } from "node:fs"

import type { LinkCheckConfig } from "../config/types"

/**
 * The `ardo` CLI passes a file path in this variable to the build process.
 * The build writes what the CLI needs to check the final output, because the
 * output is only complete after React Router has prerendered and Ardo's exit
 * hooks have moved the files.
 */
export const ARDO_BUILD_INFO_ENV = "ARDO_BUILD_INFO"

export type ArdoBuildInfo = {
  base: string
  clientDir: string
  linkCheck: LinkCheckConfig
  siteUrl?: string
}

/** Write the build info when the CLI asked for it. Returns whether it did. */
export function writeArdoBuildInfo(info: ArdoBuildInfo): boolean {
  const target = process.env[ARDO_BUILD_INFO_ENV]
  if (target == null || target === "") return false
  writeFileSync(target, JSON.stringify(info))
  return true
}

export function readArdoBuildInfo(file: string): ArdoBuildInfo | undefined {
  if (!existsSync(file)) return undefined
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"))
  return isBuildInfo(parsed) ? parsed : undefined
}

function isBuildInfo(value: unknown): value is ArdoBuildInfo {
  if (value == null || typeof value !== "object") return false
  const info = value as Record<string, unknown>
  return (
    typeof info.base === "string" &&
    typeof info.clientDir === "string" &&
    info.linkCheck != null &&
    typeof info.linkCheck === "object"
  )
}
