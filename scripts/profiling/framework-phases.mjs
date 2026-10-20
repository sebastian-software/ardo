import { appendFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { performance } from "node:perf_hooks"

// Diagnostic-only adapter for the verified React Router 8.3.0 and 8.4.0
// profiling lanes. It brackets prerender request planning, preview startup,
// rendering, and cleanup in loaded source without editing installed packages.
const output = process.env.ARDO_PROFILE_FRAMEWORK_OUTPUT ?? process.env.ARDO_PROFILE_OUTPUT
if (output != null) {
  globalThis.__ardoProfileEvent = (event, moduleUrl) => {
    const ms = performance.now()
    appendFileSync(
      output,
      `${JSON.stringify({
        pid: process.pid,
        event,
        ...(moduleUrl == null ? {} : { moduleUrl }),
        ms,
        timeOrigin: performance.timeOrigin,
        epochMs: performance.timeOrigin + ms,
      })}\n`
    )
  }
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context)
      if (!url.endsWith("/@react-router/dev/dist/vite.js")) return result
      const source = Buffer.from(result.source).toString("utf8")
      const version = /@react-router\/dev v([\d.]+)/u.exec(source)?.[1]
      if (version !== "8.3.0" && version !== "8.4.0") {
        throw new Error(`Prerender probe does not support React Router ${version ?? "unknown"}`)
      }
      const start =
        'const prerenderRequests = (typeof requests === "function" ? await requests() : requests).map(normalizePrerenderRequest);'
      const end = "process.env.IS_RR_BUILD_REQUEST = ogIsBuildRequest;"
      if (source.split(start).length !== 2 || source.split(end).length !== 2)
        throw new Error("Prerender probe source boundaries changed")
      const moduleUrl = JSON.stringify(url)
      return {
        ...result,
        source: source
          .replace(
            start,
            `globalThis.__ardoProfileEvent("prerenderStart:v${version}", ${moduleUrl});\n${start}`
          )
          .replace(
            end,
            `${end}\nglobalThis.__ardoProfileEvent("prerenderEnd:v${version}", ${moduleUrl});`
          ),
      }
    },
  })
}
