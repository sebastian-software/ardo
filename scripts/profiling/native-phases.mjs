import { appendFileSync, readFileSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"

// Diagnostic builds only. The paired timing series never imports this probe.
const project = process.env.ARDO_PROFILE_PROJECT
const output = process.env.ARDO_PROFILE_NATIVE_OUTPUT ?? process.env.ARDO_PROFILE_OUTPUT
if (project != null && output != null) {
  const require = createRequire(realpathSync(`${project}/node_modules/ardo/package.json`))
  const engineEntry = require.resolve("ferromark")
  let packageDirectory = path.dirname(engineEntry)
  let enginePackagePath
  while (packageDirectory !== path.dirname(packageDirectory)) {
    const candidate = path.join(packageDirectory, "package.json")
    try {
      const packageJson = JSON.parse(readFileSync(candidate, "utf8"))
      if (packageJson.name === "ferromark") {
        enginePackagePath = candidate
        if (packageJson.version !== "3.4.0") {
          throw new Error(`Native probe expected ferromark 3.4.0, found ${packageJson.version}.`)
        }
        break
      }
    } catch (error) {
      if (!(error instanceof SyntaxError) && error?.code !== "ENOENT") throw error
    }
    packageDirectory = path.dirname(packageDirectory)
  }
  if (enginePackagePath == null) {
    throw new Error(`Could not locate ferromark package metadata from ${engineEntry}.`)
  }
  const enginePackage = JSON.parse(readFileSync(enginePackagePath, "utf8"))
  const engineIdentity = {
    name: enginePackage.name,
    version: enginePackage.version,
    entryPath: engineEntry,
    packageJsonPath: enginePackagePath,
  }
  appendFileSync(
    output,
    `${JSON.stringify({
      pid: process.pid,
      event: "nativeProbeInitialized",
      timeOrigin: performance.timeOrigin,
      epochMs: performance.timeOrigin + performance.now(),
      engine: engineIdentity,
    })}\n`
  )
  const { JsxCompiler } = await import(pathToFileURL(engineEntry).href)
  const record = (phase, operation) => {
    const startMs = performance.now()
    try {
      return operation()
    } finally {
      const endMs = performance.now()
      appendFileSync(
        output,
        `${JSON.stringify({
          pid: process.pid,
          phase,
          startMs,
          endMs,
          durationMs: endMs - startMs,
          timeOrigin: performance.timeOrigin,
          epochStartMs: performance.timeOrigin + startMs,
          epochEndMs: performance.timeOrigin + endMs,
          engine: engineIdentity,
        })}\n`
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
