import { readArdoBuildInfo } from "../vite/build-info"
import { checkOutputLinks, formatOutputLinkDiagnostics } from "../vite/output-links"

type CheckOutcome = { type: "exit"; code: number }

type Streams = {
  stdout: Pick<NodeJS.WriteStream, "write">
  stderr: Pick<NodeJS.WriteStream, "write">
}

/** Check internal links in the finished build output that the build described in `infoFile`. */
export function checkBuildOutput(infoFile: string, streams: Streams): CheckOutcome {
  const info = readArdoBuildInfo(infoFile)
  if (info == null || info.linkCheck.enabled === false) return { type: "exit", code: 0 }

  const result = checkOutputLinks({
    base: info.base,
    checkAnchors: info.linkCheck.checkAnchors,
    clientDir: info.clientDir,
    exclude: info.linkCheck.exclude,
    siteUrl: info.siteUrl,
  })
  const checked = `${result.links} internal links in ${result.pages} pages`
  if (result.diagnostics.length === 0) {
    streams.stdout.write(`[ardo] Checked ${checked}.\n`)
    return { type: "exit", code: 0 }
  }

  const failing = info.linkCheck.level === "error"
  const count = result.diagnostics.length
  streams.stderr.write(
    `[ardo] ${count} broken internal link${count === 1 ? "" : "s"} in build output (${checked}):\n` +
      `${formatOutputLinkDiagnostics(result.diagnostics)}\n`
  )
  return { type: "exit", code: failing ? 1 : 0 }
}
