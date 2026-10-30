import { homedir } from "node:os"
import path from "node:path"

export const trackingOrigin = "https://app-tracking.sebastian-software.com"
export const trackingNotice = `Help prioritize Ardo improvements by sharing daily counts of build, dev, and preview commands,
the Ardo version, a random reporting ID, and bounded OS, architecture, and CPU categories.
Ardo does not supply command arguments, file paths, source content, or a project identifier.
Reporting is optional and separate from update checks. You can inspect unsent data with
"ardo telemetry preview", withdraw with "ardo telemetry disable", and request deletion
with "ardo telemetry delete". Privacy: https://app-tracking.sebastian-software.com/`

export type TrackedCommand = "build" | "dev" | "preview"
export type TelemetryAction = "status" | "preview" | "enable" | "disable" | "delete"
// A local structural boundary lets Ardo typecheck when the optional SDK is omitted.
export type TrackingClient = {
  record: (metric: string, dimensions: Readonly<Record<string, string>>) => Promise<string>
  flushInBackground: () => Promise<boolean>
  setOptIn: (enabled: boolean) => Promise<void>
  setDisabled: (disabled: boolean) => Promise<void>
  status: () => Promise<unknown>
  preview: () => Promise<unknown>
  delete: () => Promise<void>
}

type ClientConstructor = new (options: {
  origin: string
  stateRoot: string
  tool: string
  version: string
  interaction: "never"
  policy: { offline: boolean; ci: boolean }
}) => TrackingClient

export const trackingPackage = "@sebastian-software/app-tracking"

export function enabled(value: string | undefined): boolean {
  return value !== undefined && value !== "" && value !== "0" && value !== "false"
}

export function isCi(env: NodeJS.ProcessEnv): boolean {
  return enabled(env.CI) || enabled(env.CONTINUOUS_INTEGRATION)
}

export function ardoStateRoot(): string {
  return path.join(homedir(), ".ardo")
}

type TrackingOptions = {
  version: string
  stateRoot?: string
  env?: NodeJS.ProcessEnv
  createClient?: () => Promise<TrackingClient>
}

/** Keep SDK loading and all reporting state out of help, imports, and update checks. */
export function createTracking(options: TrackingOptions) {
  const env = options.env ?? process.env
  let pendingClient: Promise<TrackingClient> | undefined
  const client = () => {
    pendingClient ??= loadClient()
    return pendingClient
  }
  async function loadClient(): Promise<TrackingClient> {
    if (options.createClient) return options.createClient()
    try {
      const { Client } = (await import(trackingPackage)) as { Client: ClientConstructor }
      return new Client({
        origin: trackingOrigin,
        stateRoot: options.stateRoot ?? ardoStateRoot(),
        tool: "ardo",
        version: options.version,
        interaction: "never",
        policy: { offline: enabled(env.ARDO_OFFLINE), ci: isCi(env) },
      })
    } catch {
      throw new Error(
        "Usage reporting is unavailable. It requires an installed app-tracking client with Ardo registration and support for this Node.js version."
      )
    }
  }

  return {
    async record(command: TrackedCommand): Promise<void> {
      // CI has no separate informed grant in Ardo. Never borrow a local profile.
      if (isCi(env) || enabled(env.DO_NOT_TRACK)) return
      if (env.APP_TRACKING_TELEMETRY !== undefined && env.APP_TRACKING_TELEMETRY !== "on") return
      try {
        const reporting = await client()
        await reporting.record("cli.invocation", { command })
        await reporting.flushInBackground()
      } catch {
        // Optional reporting must not prevent a build or server from starting.
      }
    },
    async settings(action: TelemetryAction): Promise<unknown> {
      const reporting = await client()
      switch (action) {
        case "status":
          return reporting.status()
        case "preview":
          return reporting.preview()
        case "enable":
          await reporting.setDisabled(false)
          await reporting.setOptIn(true)
          return reporting.status()
        case "disable":
          await reporting.setOptIn(false)
          return reporting.status()
        case "delete":
          await reporting.delete()
          await reporting.flushInBackground()
          return reporting.status()
      }
    },
  }
}
