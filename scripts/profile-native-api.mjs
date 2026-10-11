import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { createRequire } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

// Run separately from timing benchmarks: SDK collection and hooks add overhead.
const root = fileURLToPath(new URL("../", import.meta.url))
const name = process.argv[2] ?? "ardo"
if (!["ardo", "library"].includes(name) || process.argv.length > 4)
  throw new Error("Usage: node scripts/profile-native-api.mjs [ardo|library] [DIST]")
const dist = path.resolve(process.argv[3] ?? path.join(root, "packages/ardo/dist"))
const profile =
  name === "ardo"
    ? {
        entry: "packages/ardo/src/index.ts",
        config: "packages/ardo/tsconfig.json",
        sourceRoot: "packages/ardo/src",
        ambient: ["packages/ardo/src/vite-env.d.ts"],
      }
    : {
        entry: "examples/library/src/index.ts",
        config: "examples/library/tsconfig.api.json",
        sourceRoot: "examples/library/src",
        ambient: [],
      }
const require = createRequire(path.join(root, "packages/ardo/package.json"))
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-phases-"))
const config = path.join(directory, "tsconfig.json")
await fs.writeFile(
  config,
  JSON.stringify({
    extends: path.join(root, profile.config),
    compilerOptions: {
      noEmit: false,
      emitDeclarationOnly: true,
      declaration: true,
      declarationMap: true,
      removeComments: false,
      noEmitOnError: true,
      incremental: false,
      typeRoots: [path.join(root, "node_modules/@types")],
      rootDir: path.join(root, profile.sourceRoot),
      outDir: path.join(directory, "declarations"),
    },
    files: [
      path.join(root, profile.entry),
      ...profile.ambient.map((file) => path.join(root, file)),
    ],
    include: [],
  })
)
const durations = {}
const calls = {}
const rpc = []
const logicalRequests = {}
const start = performance.now()
const ardo = await import(pathToFileURL(path.join(dist, "api/index.js")))
durations.ardoImport = performance.now() - start
const sdkStart = performance.now()
const sdk = await import(pathToFileURL(require.resolve("@typescript/native/async")))
durations.sdkImport = performance.now() - sdkStart
const api = new sdk.API({ cwd: directory, collectTiming: true })

// White-box measurement only: no changes to the shipped adapter or installed SDK.
const record = api.client.timing.record.bind(api.client.timing)
api.client.timing.record = (sample) => {
  rpc.push(sample)
  record(sample)
}
const request = api.client.apiRequest.bind(api.client)
api.client.apiRequest = (method, params) => {
  logicalRequests[method] = (logicalRequests[method] ?? 0) + 1
  return request(method, params)
}
function wrap(prototype, method) {
  const original = prototype[method]
  if (typeof original !== "function") return
  prototype[method] = async function (...args) {
    const started = performance.now()
    try {
      return await original.apply(this, args)
    } finally {
      durations[method] = (durations[method] ?? 0) + performance.now() - started
      calls[method] = (calls[method] ?? 0) + 1
    }
  }
}
for (const method of ["readConfigFile", "createSnapshot"]) wrap(sdk.API.prototype, method)
for (const method of [
  "getSourceFileNames",
  "getConfigFileNames",
  "emitToString",
  "getSourceFileMetadata",
  "getSourceFile",
  "getResolvedModule",
  "getModeForResolutionAtIndex",
  "getResolvedModuleFromModuleSpecifier",
])
  wrap(sdk.Program.prototype, method)
const project = new ardo.NativeApiProject({
  entryPoints: [path.join(root, profile.entry)],
  tsconfig: config,
})
project.client = sdk
project.api = api
wrap(ardo.NativeApiProject.prototype, "extractSnapshot")
try {
  const generationStart = performance.now()
  const result = await project.generate(path.join(directory, "routes"))
  durations.generation = performance.now() - generationStart
  durations.renderAndWrite = durations.generation - durations.extractSnapshot
  const timing = await api.getTimingInfo()
  const closeStart = performance.now()
  await project.close()
  durations.close = performance.now() - closeStart
  const byMethod = {}
  for (const sample of rpc) {
    const value = (byMethod[sample.method] ??= { calls: 0, ms: 0, bytesReceived: 0 })
    value.calls++
    value.ms += sample.roundTripMs
    value.bytesReceived += sample.bytesReceived
  }
  console.log(
    JSON.stringify(
      {
        name,
        dist,
        methodDurationsCanOverlap: true,
        durations,
        calls,
        logicalRequests,
        rpc: byMethod,
        timing,
        output: {
          pages: result.pages.length,
          exports: result.items.length,
          diagnostics: result.diagnostics.length,
        },
      },
      null,
      2
    )
  )
} finally {
  await project.close()
  await fs.rm(directory, { force: true, recursive: true })
}
