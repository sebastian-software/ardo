import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import { parseArgs } from "node:util"

const root = fileURLToPath(new URL("../", import.meta.url))
const script = fileURLToPath(import.meta.url)
const marker = "ARDO_BENCHMARK_RESULT:"

if (process.argv[2] === "--worker") {
  await worker(JSON.parse(process.argv[3]))
} else {
  await benchmark()
}

async function benchmark() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean" },
      runs: { type: "string", default: "7" },
      warmups: { type: "string", default: "1" },
    },
  })
  if (values.help) {
    console.log(
      "Usage: node scripts/benchmark-declaration-docs.mjs [OUTPUT.json] [--runs=7] [--warmups=1]\n" +
        "Build Ardo first. Set ARDO_DECLARATION_TSC to a native TypeScript 7 tsc executable.\n" +
        "Runs sequential fresh Node processes on Ardo and the library example; installs nothing."
    )
    return
  }
  if (positionals.length > 1) throw new Error("Only one output filename is allowed.")
  const runs = Number(values.runs)
  const warmups = Number(values.warmups)
  if (!Number.isInteger(runs) || runs < 1 || !Number.isInteger(warmups) || warmups < 0)
    throw new Error("Runs must be a positive integer and warmups a nonnegative integer.")
  const compiler = process.env.ARDO_DECLARATION_TSC
  if (!compiler) throw new Error("Set ARDO_DECLARATION_TSC to a native TypeScript 7 executable.")
  const version = compilerVersion(compiler)
  if (!/^Version 7\./u.test(version))
    throw new Error(`Expected native TypeScript 7; got ${version}.`)
  const require = createRequire(path.join(root, "packages/ardo/package.json"))
  const profiles = [
    {
      name: "ardo",
      entry: "packages/ardo/src/index.ts",
      config: "packages/ardo/tsconfig.json",
      sourceRoot: "packages/ardo/src",
      ambient: ["packages/ardo/src/vite-env.d.ts"],
    },
    {
      name: "library-example",
      entry: "examples/library/src/index.ts",
      config: "examples/library/tsconfig.api.json",
      sourceRoot: "examples/library/src",
    },
  ]
  const modes = [
    "typedoc",
    "native-two-pass",
    "native-one-pass",
    "native-incremental",
    "declarations",
  ]
  const report = {
    recordedAt: new Date().toISOString(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      osRelease: os.release(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      memoryGiB: round(os.totalmem() / 2 ** 30),
      declarationCompiler: version,
      typedoc: require("typedoc/package.json").version,
      typedocCompiler: require("typescript/package.json").version,
      oxc: JSON.parse(
        await fs.readFile(
          path.join(root, "packages/ardo/node_modules/oxc-parser/package.json"),
          "utf8"
        )
      ).version,
    },
    methodology: {
      runs,
      warmups,
      boundary: "Fresh Node process launch through written Markdown pages and process exit",
      order: "Sequential; rotate mode order each round; no concurrent benchmark jobs",
      cache:
        "OS caches are uncontrolled. No-change incremental state and existing declarations are prepared separately.",
      included:
        "Module imports, native CLI version check, complete project emit with type checking, library discovery, extraction, rendering, and writing",
      excluded:
        "Dependency installation, package build, temporary config setup, result verification, cleanup, and the subsequent Vite/HTML site build",
      nativeOptions:
        "emitDeclarationOnly, declaration, declarationMap, removeComments=false, noEmitOnError",
      typedocOptions:
        "Actual ardo/typedoc generator, plugin=[], excludeInternal/Private/Protected=true, sourceLinks=false; default breadcrumbs and hierarchy",
      output:
        "The renderers produce different page trees and content. Output counts and bytes accompany each result; this is not feature parity or correctness evidence.",
      phases:
        "Worker phase durations exclude Node startup. Parent wallMs includes process startup and exit; phase medians need not sum to the wall median.",
    },
    profiles: [],
  }
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-docs-benchmark-"))
  try {
    for (const profile of profiles) {
      console.error(`Benchmarking ${profile.name}…`)
      const directory = path.join(temporary, profile.name)
      await fs.mkdir(directory)
      const cache = await setup(profile, path.join(directory, "cache"), true)
      const prepared = compile(compiler, cache.config, true)
      const libFiles = libraries(prepared.files)
      const results = Object.fromEntries(modes.map((mode) => [mode, []]))
      let ordinal = 0
      for (let roundIndex = -warmups; roundIndex < runs; roundIndex++) {
        const offset = (roundIndex + warmups) % modes.length
        const order = [...modes.slice(offset), ...modes.slice(0, offset)]
        for (const mode of order) {
          const runDirectory = path.join(directory, `run-${ordinal++}`)
          const input =
            mode === "declarations" || mode === "native-incremental"
              ? cache
              : await setup(profile, runDirectory)
          const options = {
            mode,
            compiler,
            input,
            entry: path.join(root, profile.entry),
            packageRoot: path.dirname(path.join(root, profile.config)),
            libFiles,
            routes: path.join(runDirectory, "routes"),
          }
          const start = performance.now()
          const stdout = execFileSync(
            process.execPath,
            [script, "--worker", JSON.stringify(options)],
            {
              cwd: root,
              encoding: "utf8",
              timeout: 120_000,
              maxBuffer: 8 * 1024 * 1024,
              stdio: ["ignore", "pipe", "pipe"],
            }
          )
          const wallMs = performance.now() - start
          const line = stdout.split(/\r?\n/u).find((value) => value.startsWith(marker))
          if (!line) throw new Error(`Missing benchmark result for ${mode}.`)
          const { pagePaths, ...sample } = JSON.parse(line.slice(marker.length))
          sample.wallMs = round(wallMs)
          // Verify actual files after the timed process exits.
          sample.markdownBytes = 0
          for (const page of pagePaths) {
            const content = await fs.readFile(path.join(options.routes, "api", page))
            if (!content.length) throw new Error(`Empty generated page: ${page}`)
            sample.markdownBytes += content.length
          }
          sample.declarationOutput = await declarationStats(input.declarations)
          if (roundIndex >= 0) results[mode].push(sample)
          console.error(
            `  ${roundIndex < 0 ? "warmup" : `run ${roundIndex + 1}/${runs}`} ${mode}: ${sample.wallMs} ms, ${sample.pages} pages`
          )
        }
      }
      report.profiles.push({
        name: profile.name,
        entry: profile.entry,
        modes: modes.map((mode) => {
          const samples = results[mode]
          const output = new Set(samples.map((sample) => `${sample.pages}:${sample.markdownBytes}`))
          if (output.size !== 1)
            throw new Error(`Unstable output size for ${profile.name}/${mode}.`)
          return {
            mode,
            scenario:
              mode === "typedoc"
                ? "TypeDoc from source"
                : mode === "native-two-pass"
                  ? "Native full emit, then a second CLI project scan, then OXC"
                  : mode === "native-one-pass"
                    ? "Native full emit and library discovery in one project invocation, then OXC"
                    : mode === "native-incremental"
                      ? "Native no-change incremental build with existing output and build info, then OXC"
                      : "OXC from existing declarations and supplied library paths; no compiler",
            summary: Object.fromEntries(
              ["wallMs", "importMs", "compilerVersionMs", "compilerMs", "generateMs"].map((key) => [
                key,
                summarize(samples.map((sample) => sample[key])),
              ])
            ),
            samples,
          }
        }),
      })
    }
    if (positionals[0])
      await fs.writeFile(path.resolve(positionals[0]), `${JSON.stringify(report, null, 2)}\n`)
    for (const profile of report.profiles) {
      console.error(profile.name)
      console.table(
        profile.modes.map((mode) => ({
          Mode: mode.mode,
          "Median ms": mode.summary.wallMs.median,
          "Min ms": mode.summary.wallMs.min,
          "Max ms": mode.summary.wallMs.max,
          Pages: mode.samples[0].pages,
          "Markdown bytes": mode.samples[0].markdownBytes,
        }))
      )
    }
    if (!positionals[0]) console.log(JSON.stringify(report, null, 2))
  } finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
}

async function setup(profile, directory, incremental = false) {
  await fs.mkdir(directory, { recursive: true })
  const declarations = path.join(directory, "declarations")
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
        typeRoots: [path.join(root, "node_modules/@types")],
        rootDir: path.join(root, profile.sourceRoot),
        outDir: declarations,
        incremental,
        ...(incremental ? { tsBuildInfoFile: path.join(directory, "state.tsbuildinfo") } : {}),
      },
      files: [
        path.join(root, profile.entry),
        ...(profile.ambient ?? []).map((file) => path.join(root, file)),
      ],
      include: [],
    })
  )
  return { config, declarations, entry: path.join(declarations, "index.d.ts") }
}

async function worker(options) {
  const start = performance.now()
  const typedoc = options.mode === "typedoc"
  const api = await import(
    pathToFileURL(path.join(root, `packages/ardo/dist/${typedoc ? "typedoc" : "api"}/index.js`))
  )
  const importMs = performance.now() - start
  let compilerVersionMs = 0
  let compilerMs = 0
  let compilerProjectInvocations = 0
  let compilerProjectFiles = 0
  let libFiles = options.libFiles
  if (!typedoc && options.mode !== "declarations") {
    const check = performance.now()
    if (!/^Version 7\./u.test(compilerVersion(options.compiler)))
      throw new Error("The declaration compiler must be native TypeScript 7.")
    compilerVersionMs = performance.now() - check
    const result = compile(
      options.compiler,
      options.input.config,
      options.mode !== "native-two-pass"
    )
    compilerMs = result.ms
    compilerProjectInvocations = options.mode === "native-two-pass" ? 2 : 1
    compilerProjectFiles = result.files.length
    libFiles = libraries(result.files)
  }
  const generateStart = performance.now()
  const result = typedoc
    ? await api.generateApiDocs(
        {
          entryPoints: [options.entry],
          tsconfig: options.input.config,
          out: "api",
          plugin: [],
          excludeInternal: true,
          excludePrivate: true,
          excludeProtected: true,
          markdown: { sourceLinks: false },
        },
        options.routes
      )
    : await api.generateDeclarationDocs(
        {
          entryPoints: [options.input.entry],
          out: "api",
          packageRoot: options.packageRoot,
          libFiles,
        },
        options.routes
      )
  const generateMs = performance.now() - generateStart
  const pages = typedoc ? result : result.pages
  if (!pages.length) throw new Error("No pages were generated.")
  if (
    !typedoc &&
    (result.diagnostics.length || result.items.some((item) => !item.propertiesComplete))
  )
    throw new Error(`Incomplete extraction: ${JSON.stringify(result.diagnostics)}`)
  console.log(
    marker +
      JSON.stringify({
        importMs: round(importMs),
        compilerVersionMs: round(compilerVersionMs),
        compilerMs: round(compilerMs),
        generateMs: round(generateMs),
        compilerProjectInvocations,
        compilerProjectFiles,
        compilerLibFiles: typedoc ? null : libFiles.length,
        extractedFiles: typedoc ? null : result.files.length,
        exports: typedoc ? null : result.items.length,
        pages: pages.length,
        pagePaths: pages.map((page) => page.path),
      })
  )
}

function compile(compiler, config, onePass) {
  const start = performance.now()
  const emitted = execFileSync(
    compiler,
    ["--project", config, ...(onePass ? ["--listFiles"] : [])],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 8 * 1024 * 1024,
    }
  )
  const listing = onePass
    ? emitted
    : execFileSync(compiler, ["--project", config, "--listFilesOnly"], {
        cwd: root,
        encoding: "utf8",
        timeout: 60_000,
        maxBuffer: 8 * 1024 * 1024,
      })
  return { ms: performance.now() - start, files: listing.split(/\r?\n/u).filter(Boolean) }
}

function compilerVersion(compiler) {
  return execFileSync(compiler, ["--version"], {
    cwd: root,
    encoding: "utf8",
    timeout: 15_000,
  }).trim()
}

function libraries(files) {
  const core = files.find((file) => path.basename(file) === "lib.es5.d.ts")
  if (!core) throw new Error("The compiler did not report its ES5 library.")
  return files.filter((file) => path.dirname(file) === path.dirname(core))
}

async function declarationStats(directory) {
  const files = await fs.readdir(directory, { recursive: true }).catch((error) => {
    if (error.code === "ENOENT") return []
    throw error
  })
  const declarations = files.filter((file) => /\.d\.[cm]?ts(?:\.map)?$/u.test(file))
  let bytes = 0
  for (const file of declarations) bytes += (await fs.stat(path.join(directory, file))).size
  return { files: declarations.length, bytes }
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return {
    min: sorted[0],
    median: round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2),
    max: sorted.at(-1),
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}
