import { homedir } from "node:os"
import path from "node:path"
import { CliClient } from "@sebastian-software/app-tracking"

export type CliServices = Pick<
  CliClient,
  | "recordInvocation"
  | "complete"
  | "checkForUpdates"
  | "status"
  | "preview"
  | "enableReporting"
  | "withdrawReporting"
  | "deleteReporting"
>

export const trackingNotice = `Help prioritize Ardo improvements by sharing daily counts of build, dev, and preview commands,
the Ardo version, a random reporting ID, and bounded OS, architecture, and CPU categories.
Ardo does not supply command arguments, file paths, source content, or a project identifier.
Reporting is optional and separate from update checks. You can inspect unsent data with
"ardo telemetry preview", withdraw with "ardo telemetry disable", and request deletion
with "ardo telemetry delete". Privacy: https://app-tracking.sebastian-software.com/`

const flagEnabled = (value: string | undefined) =>
  Boolean(value && value !== "0" && value !== "false")

export function canNotifyUpdates(args: readonly string[], isTTY: boolean | undefined): boolean {
  return (
    isTTY === true &&
    !flagEnabled(process.env.CI) &&
    !flagEnabled(process.env.CONTINUOUS_INTEGRATION) &&
    !args.some(
      (argument, index) =>
        argument === "--logLevel=silent" ||
        ((argument === "--logLevel" || argument === "-l") && args[index + 1] === "silent")
    )
  )
}

export function createCliServices(options: {
  version: string
  stateRoot?: string
  origin?: string
}): CliClient {
  const stateRoot = options.stateRoot ?? path.join(homedir(), ".ardo")
  return new CliClient({
    origin: options.origin ?? "https://sebastian-app-tracking.b-cdn.net",
    stateRoot,
    tool: "ardo",
    version: options.version,
    interaction: "never",
    policy: { offline: flagEnabled(process.env.ARDO_OFFLINE) },
    invocation: {
      metric: "cli.invocation",
      categories: {
        build: { command: "build" },
        dev: { command: "dev" },
        preview: { command: "preview" },
      },
    },
    updates: {
      cacheRoot: path.join(stateRoot, "updates"),
      distribution: "github",
      mode: process.env.ARDO_UPDATE_CHECK === "0" ? "disabled" : "enabled",
    },
  })
}
