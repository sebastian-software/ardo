import { appendFileSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"

// Diagnostic builds only. Timing series must run without this preload.
const { ARDO_PROFILE_PROJECT: project, ARDO_PROFILE_OUTPUT: output } = process.env
if (project != null && output != null) {
  const require = createRequire(realpathSync(`${project}/node_modules/ardo/package.json`))
  const { JsxCompiler } = await import(pathToFileURL(require.resolve("ferromark")).href)
  const record = (phase, operation) => {
    const start = performance.now()
    try {
      return operation()
    } finally {
      appendFileSync(
        output,
        `${JSON.stringify({ pid: process.pid, phase, ms: performance.now() - start })}\n`
      )
    }
  }
  const { prepare, compile, renderCodeBlock } = JsxCompiler.prototype
  if (prepare != null) {
    JsxCompiler.prototype.prepare = function (...args) {
      const document = record("prepare.parse-and-passes", () => prepare.apply(this, args))
      return {
        metadata: document.metadata,
        render: (...options) => record("render.metadata", () => document.render(...options)),
        renderModule: (...options) =>
          record("render.module-and-highlighting", () => document.renderModule(...options)),
      }
    }
  }
  JsxCompiler.prototype.compile = function (...args) {
    return record("legacy.compile-including-highlighting", () => compile.apply(this, args))
  }
  if (renderCodeBlock != null) {
    JsxCompiler.prototype.renderCodeBlock = function (...args) {
      return record("render.standalone-code-block", () => renderCodeBlock.apply(this, args))
    }
  }
}
