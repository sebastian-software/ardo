import { appendFileSync } from "node:fs"
import { performance } from "node:perf_hooks"

// Add profileBuild() to the disposable lane's Vite plugins for a diagnostic run.
// Hook boundaries include plugin work and waits; they are not exclusive CPU time.
export function profileBuild() {
  const output = process.env.ARDO_PROFILE_OUTPUT
  const record = (event, environment) => {
    if (output == null) return
    appendFileSync(
      output,
      `${JSON.stringify({ pid: process.pid, event, environment, ms: performance.now() })}\n`
    )
  }
  const beforePrerender = {
    name: "ardo:before-prerender-profile",
    writeBundle: {
      order: "pre",
      sequential: true,
      handler() {
        record("writeBundleStart", this.environment.name)
      },
    },
  }
  return [
    beforePrerender,
    {
      name: "ardo:build-profile",
      enforce: "post",
      configResolved() {
        record("configResolved")
      },
      buildStart() {
        record("buildStart", this.environment.name)
      },
      buildEnd() {
        record("buildEnd", this.environment.name)
      },
      generateBundle() {
        record("generateBundle", this.environment.name)
      },
      writeBundle: {
        order: "post",
        sequential: true,
        handler() {
          record("writeBundleEnd", this.environment.name)
        },
      },
      closeBundle() {
        record("closeBundle", this.environment.name)
      },
    },
  ]
}
