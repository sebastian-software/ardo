import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
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
      modes: { type: "string" },
      baseline: { type: "string" },
      "typedoc-dist": { type: "string" },
      profiles: { type: "string" },
      "allow-incomplete": { type: "boolean", default: false },
      "profile-dir": { type: "string" },
    },
  })
  if (values.help) {
    console.log(
      "Usage: node scripts/benchmark-declaration-docs.mjs [OUTPUT.json] [--runs=7] [--warmups=1]\n" +
        "Build Ardo first. Set ARDO_DECLARATION_TSC to a native TypeScript 7 tsc executable.\n" +
        "Runs sequential fresh Node processes on Ardo and the library example; installs nothing.\n" +
        "--modes=NAME,... selects scenarios. Additional modes: native-baseline, declarations-baseline,\n" +
        "workspace-one-pass, native-binary, native-api, native-api-baseline.\n" +
        "Native-api modes use the pinned async Node API.\n" +
        "Baseline modes require --baseline=/path/to/old/dist.\n" +
        "TypeDoc comparisons require --modes=typedoc,... --typedoc-dist=/path/to/pre-removal/dist.\n" +
        "Native-binary requires ARDO_DECLARATION_NATIVE_BINARY.\n" +
        "--profiles=FILE selects JSON input profiles; paths are relative to that file.\n" +
        "--allow-incomplete records extraction gaps for performance research instead of rejecting them.\n" +
        "--profile-dir=DIR records CPU profiles; use --runs=1 --warmups=0 for diagnosis, not timing claims."
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
  const defaultProfiles = [
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
  const profileFile = values.profiles ? path.resolve(values.profiles) : undefined
  const selectedProfiles = profileFile
    ? JSON.parse(await fs.readFile(profileFile, "utf8"))
    : defaultProfiles
  if (!Array.isArray(selectedProfiles) || !selectedProfiles.length)
    throw new Error("Profiles must be a nonempty JSON array.")
  const profileNames = new Set()
  const profiles = selectedProfiles.map((profile) => {
    if (
      !profile ||
      typeof profile.name !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/u.test(profile.name) ||
      profileNames.has(profile.name) ||
      ["entry", "config", "sourceRoot"].some((key) => typeof profile[key] !== "string")
    )
      throw new Error("Profiles need unique safe names, entry, config, and sourceRoot paths.")
    profileNames.add(profile.name)
    const base = profileFile ? path.dirname(profileFile) : root
    return {
      ...profile,
      entry: path.resolve(base, profile.entry),
      config: path.resolve(base, profile.config),
      sourceRoot: path.resolve(base, profile.sourceRoot),
      packageRoot: path.resolve(base, profile.packageRoot ?? path.dirname(profile.config)),
      ambient: (profile.ambient ?? []).map((file) => path.resolve(base, file)),
      // The historical repository profiles explicitly use workspace @types.
      typeRoots: profile.typeRoots
        ? profile.typeRoots.map((directory) => path.resolve(base, directory))
        : profileFile
          ? undefined
          : [path.join(root, "node_modules/@types")],
    }
  })
  const defaults = [
    "native-api",
    "native-two-pass",
    "native-one-pass",
    "native-incremental",
    "declarations",
  ]
  const supported = [
    ...defaults,
    "typedoc",
    "native-baseline",
    "declarations-baseline",
    "workspace-one-pass",
    "native-binary",
    "native-api-baseline",
  ]
  const modes = values.modes ? values.modes.split(",") : defaults
  if (
    !modes.length ||
    new Set(modes).size !== modes.length ||
    modes.some((mode) => !supported.includes(mode))
  )
    throw new Error(`Select unique modes from: ${supported.join(", ")}.`)
  const currentDist = path.join(root, "packages/ardo/dist")
  const typedocDist = values["typedoc-dist"] ? path.resolve(values["typedoc-dist"]) : undefined
  if (modes.includes("typedoc")) {
    if (!typedocDist)
      throw new Error(
        "TypeDoc mode requires --typedoc-dist pointing to a preserved pre-removal build."
      )
    await fs.access(path.join(typedocDist, "typedoc/index.js"))
  }
  const baselineDist = values.baseline ? path.resolve(values.baseline) : undefined
  if (modes.some((mode) => mode.endsWith("baseline")) && !baselineDist)
    throw new Error(
      "Baseline modes require --baseline pointing to a preserved package dist directory."
    )
  const nativeBinary = process.env.ARDO_DECLARATION_NATIVE_BINARY
  if (
    modes.includes("native-binary") &&
    (!nativeBinary || compilerVersion(nativeBinary) !== version)
  )
    throw new Error(
      "Set ARDO_DECLARATION_NATIVE_BINARY to the matching native compiler executable."
    )
  const profileDirectory = values["profile-dir"] ? path.resolve(values["profile-dir"]) : undefined
  if (profileDirectory) await fs.mkdir(profileDirectory, { recursive: true })
  const report = {
    recordedAt: new Date().toISOString(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    sourceDirty: Boolean(
      execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()
    ),
    implementation: {
      typedocDist: typedocDist ?? null,
      typedocEntrySha256: typedocDist
        ? createHash("sha256")
            .update(await fs.readFile(path.join(typedocDist, "typedoc/index.js")))
            .digest("hex")
        : null,
      currentApiSha256: createHash("sha256")
        .update(await fs.readFile(path.join(currentDist, "api/index.js")))
        .digest("hex"),
      currentApiChunks: await apiImplementationHashes(currentDist),
      baselineApiChunks: baselineDist ? await apiImplementationHashes(baselineDist) : null,
      baselineApiSha256: baselineDist
        ? createHash("sha256")
            .update(await fs.readFile(path.join(baselineDist, "api/index.js")))
            .digest("hex")
        : null,
    },
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
      cpuProfiling: Boolean(profileDirectory),
      allowIncomplete: values["allow-incomplete"],
      boundary: "Fresh Node process launch through written Markdown pages and process exit",
      order: "Sequential; rotate mode order each round; no concurrent benchmark jobs",
      cache:
        "OS caches are uncontrolled. No-change incremental state and existing declarations are prepared separately.",
      included:
        "Module imports; CLI compiler scenarios include version validation, checked project emit and library discovery; native-api includes checked in-memory emit, compiler resolution and session disposal inside generateMs; all modes include extraction, rendering and writing",
      excluded:
        "Dependency installation, package build, temporary config setup, result verification, cleanup, and the subsequent Vite/HTML site build",
      nativeOptions:
        "emitDeclarationOnly, declaration, declarationMap, removeComments=false, noEmitOnError",
      typedocOptions:
        "Preserved pre-removal ardo/typedoc generator, plugin=[], excludeInternal/Private/Protected=true, sourceLinks=false; default breadcrumbs and hierarchy",
      output:
        "Native scenarios must produce identical page paths and Markdown bytes across runs and implementations. TypeDoc and the workspace compiler are reported separately. Counts alone are not feature parity or correctness evidence.",
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
      const projectSource = await sourceStats(profile.sourceRoot, prepared.files)
      const results = Object.fromEntries(modes.map((mode) => [mode, []]))
      let ordinal = 0
      for (let roundIndex = -warmups; roundIndex < runs; roundIndex++) {
        const offset = (roundIndex + warmups) % modes.length
        const order = [...modes.slice(offset), ...modes.slice(0, offset)]
        for (const mode of order) {
          const runDirectory = path.join(directory, `run-${ordinal++}`)
          const input =
            mode.startsWith("declarations") || mode === "native-incremental"
              ? cache
              : await setup(profile, runDirectory)
          const options = {
            mode,
            compiler:
              mode === "native-binary"
                ? nativeBinary
                : mode === "workspace-one-pass"
                  ? path.join(root, "node_modules/typescript/bin/tsc")
                  : compiler,
            dist:
              mode === "typedoc"
                ? typedocDist
                : mode.endsWith("baseline")
                  ? baselineDist
                  : currentDist,
            input,
            entry: profile.entry,
            packageRoot: profile.packageRoot,
            allowIncomplete: values["allow-incomplete"],
            libFiles,
            routes: path.join(runDirectory, "routes"),
          }
          const start = performance.now()
          const stdout = execFileSync(
            process.execPath,
            [
              ...(profileDirectory
                ? [
                    "--cpu-prof",
                    "--cpu-prof-interval=100",
                    `--cpu-prof-dir=${profileDirectory}`,
                    `--cpu-prof-name=${profile.name}-${mode}-${ordinal}.cpuprofile`,
                  ]
                : []),
              script,
              "--worker",
              JSON.stringify(options),
            ],
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
          const hash = createHash("sha256")
          for (const page of pagePaths.sort()) {
            const content = await fs.readFile(path.join(options.routes, "api", page))
            if (!content.length) throw new Error(`Empty generated page: ${page}`)
            sample.markdownBytes += content.length
            hash.update(page).update("\0").update(content).update("\0")
          }
          sample.markdownSha256 = hash.digest("hex")
          sample.declarationOutput = await declarationStats(input.declarations)
          if (roundIndex >= 0) results[mode].push(sample)
          console.error(
            `  ${roundIndex < 0 ? "warmup" : `run ${roundIndex + 1}/${runs}`} ${mode}: ${sample.wallMs} ms, ${sample.pages} pages`
          )
        }
      }
      const nativeOutputs = new Set(
        modes
          .filter((mode) => mode !== "typedoc" && mode !== "workspace-one-pass")
          .flatMap((mode) => results[mode].map((sample) => sample.markdownSha256))
      )
      if (nativeOutputs.size > 1)
        throw new Error(`Native scenarios changed Markdown content for ${profile.name}.`)
      report.profiles.push({
        name: profile.name,
        entry: profile.entry,
        provenance: profile.provenance ?? null,
        input: {
          projectSource,
          compilerProjectFiles: prepared.files.length,
          compilerLibFiles: libFiles.length,
          baseConfig: await fs.readFile(profile.config, "utf8"),
        },
        modes: modes.map((mode) => {
          const samples = results[mode]
          const output = new Set(samples.map((sample) => sample.markdownSha256))
          if (output.size !== 1)
            throw new Error(`Unstable Markdown content for ${profile.name}/${mode}.`)
          return {
            mode,
            scenario:
              mode === "native-api" || mode === "native-api-baseline"
                ? `Native async API${mode.endsWith("baseline") ? " baseline" : ""} checked in-memory emit, compiler resolution, OXC, Markdown, and session disposal; compiler included in generateMs`
                : mode === "workspace-one-pass"
                  ? "Workspace JavaScript TypeScript full emit and library discovery, then OXC"
                  : mode === "native-binary"
                    ? "Direct native executable, checked full emit and library discovery, then OXC"
                    : mode === "native-baseline"
                      ? "Native full emit and library discovery, then preserved baseline OXC implementation"
                      : mode === "declarations-baseline"
                        ? "Preserved baseline OXC implementation from existing declarations; no compiler"
                        : mode === "typedoc"
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

async function apiImplementationHashes(directory) {
  const chunks = (await fs.readdir(directory)).filter((file) =>
    /^(?:native-project|generated-docs|generator|renderer)-.*\.js$/u.test(file)
  )
  return Promise.all(
    ["api/index.js", ...chunks].sort().map(async (file) => ({
      file,
      sha256: createHash("sha256")
        .update(await fs.readFile(path.join(directory, file)))
        .digest("hex"),
    }))
  )
}

async function setup(profile, directory, incremental = false) {
  await fs.mkdir(directory, { recursive: true })
  const declarations = path.join(directory, "declarations")
  const config = path.join(directory, "tsconfig.json")
  await fs.writeFile(
    config,
    JSON.stringify({
      extends: profile.config,
      compilerOptions: {
        noEmit: false,
        emitDeclarationOnly: true,
        declaration: true,
        declarationMap: true,
        removeComments: false,
        noEmitOnError: true,
        ...(profile.typeRoots ? { typeRoots: profile.typeRoots } : {}),
        rootDir: profile.sourceRoot,
        outDir: declarations,
        // An upstream declarationDir would otherwise bypass this run's output directory.
        declarationDir: declarations,
        incremental,
        ...(incremental ? { tsBuildInfoFile: path.join(directory, "state.tsbuildinfo") } : {}),
      },
      files: [profile.entry, ...profile.ambient],
      include: [],
    })
  )
  return {
    config,
    declarations,
    entry: path.join(
      declarations,
      path
        .relative(profile.sourceRoot, profile.entry)
        .replace(/\.(?:tsx?|mts|cts)$/u, (extension) =>
          extension === ".mts" ? ".d.mts" : extension === ".cts" ? ".d.cts" : ".d.ts"
        )
    ),
  }
}

async function worker(options) {
  const start = performance.now()
  const typedoc = options.mode === "typedoc"
  const nativeApi = options.mode === "native-api" || options.mode === "native-api-baseline"
  const api = await import(
    pathToFileURL(path.join(options.dist, `${typedoc ? "typedoc" : "api"}/index.js`))
  )
  const importMs = performance.now() - start
  let compilerVersionMs = 0
  let compilerMs = 0
  let compilerProjectInvocations = 0
  let compilerProjectFiles = 0
  let libFiles = options.libFiles
  if (!typedoc && !nativeApi && !options.mode.startsWith("declarations")) {
    const check = performance.now()
    const expected = options.mode === "workspace-one-pass" ? /^Version 6\./u : /^Version 7\./u
    if (!expected.test(compilerVersion(options.compiler)))
      throw new Error("The declaration compiler does not match the selected scenario.")
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
    : nativeApi
      ? await api.generateNativeDocs(
          { entryPoints: [options.entry], tsconfig: options.input.config, out: "api" },
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
  if (pages.length < 2 || (!typedoc && result.items.length === 0))
    throw new Error(
      "No public API pages were generated; an index alone is not a documentation workload."
    )
  if (
    !typedoc &&
    !options.allowIncomplete &&
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
        compilerProjectInvocations: nativeApi ? 1 : compilerProjectInvocations,
        compilerProjectFiles: nativeApi ? null : compilerProjectFiles,
        compilerLibFiles: typedoc || nativeApi ? null : libFiles.length,
        extractedFiles: typedoc ? null : result.files.length,
        exports: typedoc ? null : result.items.length,
        extraction: typedoc
          ? null
          : {
              diagnostics: result.diagnostics.map((diagnostic) => ({
                file: path.relative(options.input.declarations, diagnostic.file),
                message: diagnostic.message,
              })),
              incompleteExports: result.items
                .filter((item) => !item.propertiesComplete)
                .map((item) => item.name),
            },
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

async function sourceStats(sourceRoot, files) {
  const sources = files
    .map((file) => ({ file, relative: path.relative(sourceRoot, file) }))
    .filter(
      ({ file, relative }) =>
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative) &&
        /\.[cm]?tsx?$/u.test(file) &&
        !/\.d\.[cm]?ts$/u.test(file)
    )
    .sort((left, right) => left.relative.localeCompare(right.relative))
  const hash = createHash("sha256")
  let bytes = 0
  let linesIncludingCommentsAndBlanks = 0
  for (const { file, relative } of sources) {
    const content = await fs.readFile(file)
    bytes += content.length
    linesIncludingCommentsAndBlanks += content.toString("utf8").split("\n").length
    hash.update(relative).update("\0").update(content).update("\0")
  }
  return {
    files: sources.length,
    bytes,
    linesIncludingCommentsAndBlanks,
    sha256: hash.digest("hex"),
  }
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
