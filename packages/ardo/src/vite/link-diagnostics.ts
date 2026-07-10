import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { checkInternalLinks, formatLinkCheckDiagnostics } from "./build-outputs"

export function reportLinkDiagnostics(
  context: { error: (message: string) => never; warn: (message: string) => void },
  manifest: RouteManifestEntry[],
  config: ResolvedConfig
) {
  const diagnostics = checkInternalLinks(manifest, config)
  if (diagnostics.length === 0) return

  const message = `[ardo] Broken internal links found:\n${formatLinkCheckDiagnostics(diagnostics)}`
  if (config.linkCheck.level === "error") {
    context.error(message)
  } else {
    context.warn(message)
  }
}
