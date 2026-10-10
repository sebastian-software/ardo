import { appendFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { performance } from "node:perf_hooks"

// Diagnostic-only adapter for the pinned React Router 8.4.0 profiling corpus.
// It brackets prerender request planning, preview startup, rendering, and cleanup
// in loaded source, without editing the installed package on disk.
const output = process.env.ARDO_PROFILE_OUTPUT
if (output != null) {
  globalThis.__ardoProfileEvent = (event) =>
    appendFileSync(
      output,
      `${JSON.stringify({ pid: process.pid, event, ms: performance.now() })}\n`
    )
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context)
      if (!url.endsWith("/@react-router/dev/dist/vite.js")) return result
      const source = Buffer.from(result.source).toString("utf8")
      if (!source.includes("@react-router/dev v8.4.0"))
        throw new Error("Prerender probe requires the pinned React Router 8.4.0 source")
      const start =
        'const prerenderRequests = (typeof requests === "function" ? await requests() : requests).map(normalizePrerenderRequest);'
      const end = "process.env.IS_RR_BUILD_REQUEST = ogIsBuildRequest;"
      if (source.split(start).length !== 2 || source.split(end).length !== 2)
        throw new Error("Prerender probe source boundaries changed")
      return {
        ...result,
        source: source
          .replace(start, `globalThis.__ardoProfileEvent("prerenderStart");\n${start}`)
          .replace(end, `${end}\nglobalThis.__ardoProfileEvent("prerenderEnd");`),
      }
    },
  })
}
