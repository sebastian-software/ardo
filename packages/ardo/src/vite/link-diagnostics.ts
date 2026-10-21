import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { writeArdoBuildInfo } from "./build-info"
import { checkInternalLinks, formatLinkCheckDiagnostics } from "./build-outputs"

/**
 * Hand link checking to the ardo CLI, which checks every link in the finished
 * HTML, including links from components and generated pages. Without the CLI,
 * fall back to the links found in Markdown and MDX sources.
 */
export function reportOrDeferLinkDiagnostics(
  context: { error: (message: string) => never; warn: (message: string) => void },
  manifest: RouteManifestEntry[],
  { config, clientDir }: { config: ResolvedConfig; clientDir: string | undefined }
) {
  const deferred =
    clientDir != null &&
    writeArdoBuildInfo({
      base: config.base,
      clientDir,
      linkCheck: config.linkCheck,
      siteUrl: config.siteUrl,
    })
  if (!deferred) reportLinkDiagnostics(context, manifest, config)
}

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
