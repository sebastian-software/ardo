import { createTracking, type TelemetryAction, type TrackedCommand } from "./tracking"
import { automaticUpdatesAllowed, checkForUpdates, type UpdateResult } from "./updates"

export type CliServices = {
  start: (command: TrackedCommand, notifyUpdates?: boolean) => Promise<() => void>
  telemetry: (action: TelemetryAction) => Promise<unknown>
  checkUpdates: () => Promise<UpdateResult | undefined>
}

export function createCliServices(options: {
  version: string
  env?: NodeJS.ProcessEnv
  stderr?: Pick<NodeJS.WriteStream, "write" | "isTTY">
}): CliServices {
  const env = options.env ?? process.env
  const stderr = options.stderr ?? process.stderr
  const tracking = createTracking({ version: options.version, env })
  return {
    async start(command, notifyUpdates = true) {
      await tracking.record(command)
      const controller = new AbortController()
      if (notifyUpdates && stderr.isTTY && automaticUpdatesAllowed(env)) {
        void checkForUpdates({ version: options.version, env, signal: controller.signal })
          .then((release) => {
            if (release?.newer && !controller.signal.aborted) {
              stderr.write(
                `\nArdo ${release.latest} is available (installed: ${options.version}).\n${release.releaseUrl}\nUpdate the ardo dependency with your package manager.\n`
              )
            }
          })
          .catch(() => {
            /* Advisory checks do not determine command success. */
          })
      }
      return () => controller.abort()
    },
    telemetry: (action) => tracking.settings(action),
    checkUpdates: () => checkForUpdates({ version: options.version, env }),
  }
}
