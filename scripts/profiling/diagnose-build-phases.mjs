import { createHash } from "node:crypto"
import { execFileSync, spawn } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"

const [profileInput, harnessInput] = process.argv.slice(2)
if (!profileInput || !harnessInput) {
  throw new Error("Usage: node diagnose-build-phases.mjs PROFILE_ROOT HARNESS_ROOT")
}

const expectedArdoSource = "493e53405e906fbc051d9e9d7a9d00a7d338a642"
const expectedFerrikiSource = "676b8e953e6597a337fc644e712a4a30e5b8bea5"
const expectedFixtureSha256 = "be71440bb815f448cacd039ff2909139f6b2099b7036d82fc321105122a00d04"
const expectedBaselineLockSha256 =
  "1e00152c77342c2f6a41b77fc58f5d9a779bb63d79b91d6bb1f3d31b7a393a96"
const profileRoot = path.resolve(profileInput)
const harnessRoot = path.resolve(harnessInput)
const diagnosticRoot = path.join(profileRoot, "diagnostics")
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const diagnosticRunStartedAt = new Date().toISOString()
const laneResults = {}
const activeConfigs = new Map()
const errors = []
let semanticGate
let prepared
let setup
let samples
let pairedSemanticGate

// Exclusive creation keeps every diagnostic attempt and prevents overwrites.
mkdirSync(diagnosticRoot)

function writeJson(filename, value) {
  writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`)
}

function readJson(filename) {
  return JSON.parse(readFileSync(filename, "utf8"))
}

function inventory(directory, relative = "") {
  return readdirSync(path.join(directory, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(relative, entry.name)
      if (entry.isDirectory()) return inventory(directory, file)
      if (!entry.isFile()) return []
      const bytes = readFileSync(path.join(directory, file))
      return [{ path: file, bytes: bytes.length, sha256: digest(bytes) }]
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}

function readNdjson(filename) {
  if (!existsSync(filename)) return []
  return readFileSync(filename, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(`Invalid NDJSON at ${filename}:${index + 1}: ${error.message}`)
      }
    })
}

function assertWithin(root, candidate, label) {
  const relative = path.relative(root, candidate)
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its expected root: ${candidate}`)
  }
}

function runCommand(command, args, cwd, env, stdoutPath, stderrPath) {
  const stdout = []
  const stderr = []
  const startedAt = new Date().toISOString()
  const started = performance.now()
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] })
    child.stdout.on("data", (chunk) => stdout.push(chunk))
    child.stderr.on("data", (chunk) => stderr.push(chunk))
    let spawnError
    child.once("close", (code, signal) => {
      const stdoutBytes = Buffer.concat(stdout)
      const stderrBytes = Buffer.concat(stderr)
      writeFileSync(stdoutPath, stdoutBytes)
      writeFileSync(stderrPath, stderrBytes)
      resolve({
        command: [command, ...args],
        cwd,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: performance.now() - started,
        exit: { code, signal },
        ...(spawnError ? { spawnError: spawnError.message } : {}),
        stdoutSha256: digest(stdoutBytes),
        stderrSha256: digest(stderrBytes),
      })
    })
    child.once("error", (error) => {
      spawnError = error
    })
  })
}

function instrumentationSummary(vitePath, frameworkPath, nativePath, cpuProfilePath) {
  const viteEvents = readNdjson(vitePath)
  const frameworkEvents = readNdjson(frameworkPath)
  const nativeEvents = readNdjson(nativePath)
  const viteCounts = Object.fromEntries(
    [...new Set(viteEvents.map((event) => event.event))]
      .sort()
      .map((eventName) => [
        eventName,
        viteEvents.filter((event) => event.event === eventName).length,
      ])
  )
  const viteGroups = new Map()
  for (const event of viteEvents) {
    const key = `${event.pid}\t${event.environment ?? "(config)"}`
    if (!viteGroups.has(key)) viteGroups.set(key, [])
    viteGroups.get(key).push(event)
  }
  const viteWindows = []
  for (const [key, records] of viteGroups) {
    const [pid, environment] = key.split("\t")
    const starts = []
    for (const event of records.sort((left, right) => left.ms - right.ms)) {
      if (event.event === "buildStart") starts.push(event)
      if (event.event === "buildEnd" && starts.length > 0) {
        const start = starts.shift()
        viteWindows.push({
          pid: Number(pid),
          environment,
          startEpochMs: start.epochMs,
          endEpochMs: event.epochMs,
          durationMs: event.ms - start.ms,
        })
      }
    }
  }

  const prerenderGroups = new Map()
  for (const event of frameworkEvents) {
    const match = /^prerender(Start|End):v([\d.]+)$/u.exec(event.event ?? "")
    if (!match) continue
    const key = `${event.pid}\t${match[2]}\t${event.moduleUrl}`
    if (!prerenderGroups.has(key)) {
      prerenderGroups.set(key, {
        starts: [],
        ends: [],
        version: match[2],
        moduleUrl: event.moduleUrl,
      })
    }
    prerenderGroups.get(key)[match[1] === "Start" ? "starts" : "ends"].push(event)
  }
  const prerenderWindows = []
  const prerenderUnmatched = []
  for (const [key, group] of prerenderGroups) {
    group.starts.sort((left, right) => left.epochMs - right.epochMs)
    group.ends.sort((left, right) => left.epochMs - right.epochMs)
    const count = Math.min(group.starts.length, group.ends.length)
    for (let index = 0; index < count; index++) {
      const start = group.starts[index]
      const end = group.ends[index]
      prerenderWindows.push({
        pid: start.pid,
        version: group.version,
        moduleUrl: group.moduleUrl,
        startEpochMs: start.epochMs,
        endEpochMs: end.epochMs,
        durationMs: end.epochMs - start.epochMs,
      })
    }
    if (group.starts.length !== group.ends.length) {
      prerenderUnmatched.push({
        key,
        starts: group.starts.length,
        ends: group.ends.length,
      })
    }
  }

  const nativePhases = new Map()
  for (const event of nativeEvents) {
    if (typeof event.phase !== "string") continue
    if (!nativePhases.has(event.phase)) nativePhases.set(event.phase, [])
    nativePhases.get(event.phase).push(event.durationMs)
  }
  const nativePhaseSummary = Object.fromEntries(
    [...nativePhases.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([phase, durations]) => [
        phase,
        {
          calls: durations.length,
          totalInclusiveMs: durations.reduce((sum, value) => sum + value, 0),
          meanInclusiveMs: durations.reduce((sum, value) => sum + value, 0) / durations.length,
          maxInclusiveMs: Math.max(...durations),
        },
      ])
  )
  const cpuProfiles = inventory(cpuProfilePath)
  return {
    rawEvents: {
      vite: {
        path: path.basename(vitePath),
        count: viteEvents.length,
        sha256: existsSync(vitePath) ? digest(readFileSync(vitePath)) : null,
      },
      framework: {
        path: path.basename(frameworkPath),
        count: frameworkEvents.length,
        sha256: existsSync(frameworkPath) ? digest(readFileSync(frameworkPath)) : null,
      },
      native: {
        path: path.basename(nativePath),
        count: nativeEvents.length,
        sha256: existsSync(nativePath) ? digest(readFileSync(nativePath)) : null,
      },
    },
    vite: {
      eventCounts: viteCounts,
      configResolvedCount: viteCounts.configResolved ?? 0,
      buildWindows: viteWindows,
      unmatchedBuildStarts:
        [...viteGroups.values()].reduce(
          (sum, records) => sum + records.filter((event) => event.event === "buildStart").length,
          0
        ) - viteWindows.length,
    },
    reactRouter: {
      eventCounts: Object.fromEntries(
        [...new Set(frameworkEvents.map((event) => event.event))]
          .sort()
          .map((eventName) => [
            eventName,
            frameworkEvents.filter((event) => event.event === eventName).length,
          ])
      ),
      prerenderLifecycleWindows: prerenderWindows,
      unmatchedPrerenderEvents: prerenderUnmatched,
    },
    native: {
      initializedProcesses: nativeEvents
        .filter((event) => event.event === "nativeProbeInitialized")
        .map((event) => ({ pid: event.pid, engine: event.engine, epochMs: event.epochMs })),
      phases: nativePhaseSummary,
      durationsAreInclusiveAndMayOverlap: true,
    },
    cpuProfiles: {
      count: cpuProfiles.length,
      files: cpuProfiles,
      totalBytes: cpuProfiles.reduce((sum, file) => sum + file.bytes, 0),
    },
  }
}

function installViteProbe(laneName, homepage, prepared) {
  const configPath = path.join(homepage, "vite.config.ts")
  const originalBytes = readFileSync(configPath)
  const originalSha256 = digest(originalBytes)
  const expectedSha256 = prepared.lanes[laneName].adapters.vite.adaptedSha256
  if (originalSha256 !== expectedSha256) {
    throw new Error(`${laneName} Vite config does not match the prepared resolver adapter.`)
  }
  const laneOutput = path.join(diagnosticRoot, laneName)
  const savedConfigPath = path.join(laneOutput, "vite.config.before-probe.ts")
  const instrumentedConfigPath = path.join(laneOutput, "vite.config.instrumented.ts")
  writeFileSync(savedConfigPath, originalBytes, { flag: "wx" })

  const original = originalBytes.toString("utf8")
  const ardoImport = 'import { ardo } from "ardo/vite";\n'
  const pluginsAnchor = "  plugins: [\n"
  if (original.split(ardoImport).length !== 2 || original.split(pluginsAnchor).length !== 2) {
    throw new Error(`${laneName} Vite config no longer matches the reviewed probe anchors.`)
  }
  const viteProbePath = path.join(harnessRoot, "scripts/profiling/vite-phases.mjs")
  const frameworkProbePath = path.join(harnessRoot, "scripts/profiling/framework-phases.mjs")
  const nativeProbePath = path.join(harnessRoot, "scripts/profiling/native-phases.mjs")
  const imports = [
    `import { profileBuild } from ${JSON.stringify(viteProbePath)};`,
    ...(laneName === "candidate" ? [`import ${JSON.stringify(nativeProbePath)};`] : []),
  ].join("\n")
  const instrumented = original
    .replace(ardoImport, `${ardoImport}${imports}\n`)
    .replace(pluginsAnchor, `${pluginsAnchor}    ...profileBuild(),\n`)
  writeFileSync(instrumentedConfigPath, instrumented, { flag: "wx" })
  activeConfigs.set(configPath, originalBytes)
  writeFileSync(configPath, instrumented)

  return {
    configPath,
    originalBytes,
    originalSha256,
    instrumentedSha256: digest(Buffer.from(instrumented)),
    savedConfigPath,
    instrumentedConfigPath,
    frameworkProbePath,
    nativeProbePath,
  }
}

function restoreConfig(configPath) {
  const originalBytes = activeConfigs.get(configPath)
  if (originalBytes == null) return null
  writeFileSync(configPath, originalBytes)
  const restoredSha256 = digest(readFileSync(configPath))
  const expectedSha256 = digest(originalBytes)
  if (restoredSha256 !== expectedSha256) {
    throw new Error(`Could not restore Vite config byte-for-byte: ${configPath}`)
  }
  activeConfigs.delete(configPath)
  return restoredSha256
}

async function runLane(laneName, prepared, setup) {
  const lane = prepared.lanes[laneName]
  const laneRoot = path.resolve(profileRoot, "lanes", laneName)
  const homepage = path.resolve(profileRoot, lane.homepage)
  const cache = path.resolve(profileRoot, lane.cache)
  const laneOutput = path.join(diagnosticRoot, laneName)
  assertWithin(profileRoot, homepage, `${laneName} homepage`)
  assertWithin(profileRoot, cache, `${laneName} cache`)
  mkdirSync(laneOutput)
  const cpuProfilePath = path.join(laneOutput, "cpu-profiles")
  mkdirSync(cpuProfilePath)
  const viteEventsPath = path.join(laneOutput, "vite-phases.ndjson")
  const frameworkEventsPath = path.join(laneOutput, "framework-phases.ndjson")
  const nativeEventsPath = path.join(laneOutput, "native-phases.ndjson")
  const cacheBefore = inventory(cache)
  const packageJsonPath = path.join(homepage, "package.json")
  const lockPath = path.join(homepage, "pnpm-lock.yaml")
  const packageBeforeSha256 = digest(readFileSync(packageJsonPath))
  const lockBeforeSha256 = digest(readFileSync(lockPath))
  if (packageBeforeSha256 !== lane.packageJsonSha256) {
    throw new Error(`${laneName} manifest differs from its prepared receipt.`)
  }
  if (lockBeforeSha256 !== setup.lanes[laneName].lockSha256) {
    throw new Error(`${laneName} lockfile differs from its installed setup receipt.`)
  }
  const expectedCache = [
    ...new Map(
      lane.cacheEntries.map((entry) => [
        entry.sha256,
        { path: entry.sha256, bytes: entry.size, sha256: entry.sha256 },
      ])
    ).values(),
  ].sort((left, right) => left.path.localeCompare(right.path))
  if (JSON.stringify(cacheBefore) !== JSON.stringify(expectedCache)) {
    throw new Error(`${laneName} offline asset cache differs from its prepared receipt.`)
  }
  const installedArdo = JSON.parse(
    readFileSync(path.join(homepage, "node_modules/ardo/package.json"), "utf8")
  )
  if (installedArdo.version !== setup.lanes[laneName].installedArdoVersion) {
    throw new Error(`${laneName} installed Ardo package changed since setup.`)
  }
  writeJson(path.join(laneOutput, "cache-before.json"), cacheBefore)
  rmSync(path.join(homepage, "build"), { recursive: true, force: true })

  const config = installViteProbe(laneName, homepage, prepared)
  const frameworkUrl = pathToFileURL(config.frameworkProbePath).href
  const cpuPathHasWhitespace = /\s/u.test(cpuProfilePath)
  if (cpuPathHasWhitespace) {
    restoreConfig(config.configPath)
    throw new Error(`CPU profile path cannot contain whitespace: ${cpuProfilePath}`)
  }
  const nodeOptions = [
    "--max-old-space-size=16384",
    "--no-deprecation",
    "--cpu-prof",
    `--cpu-prof-dir=${cpuProfilePath}`,
    `--import=${frameworkUrl}`,
  ].join(" ")
  const buildEnv = {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    ARDO_PROFILE_PROJECT: homepage,
    ARDO_PROFILE_VITE_OUTPUT: viteEventsPath,
    ARDO_PROFILE_FRAMEWORK_OUTPUT: frameworkEventsPath,
    ARDO_PROFILE_NATIVE_OUTPUT: nativeEventsPath,
    FERRIKI_CACHE_DIR: cache,
    FERRIKI_ASSETS_REMOTE: "0",
  }
  delete buildEnv.ARDO_PROFILE_OUTPUT
  const buildCommand =
    laneName === "baseline" ? ["exec", "react-router", "build"] : ["exec", "ardo", "build"]
  let buildReceipt
  try {
    buildReceipt = await runCommand(
      "pnpm",
      buildCommand,
      homepage,
      buildEnv,
      path.join(laneOutput, "build.stdout.log"),
      path.join(laneOutput, "build.stderr.log")
    )
  } finally {
    config.restoredSha256 = restoreConfig(config.configPath)
  }
  writeJson(path.join(laneOutput, "build.json"), {
    ...buildReceipt,
    displayCommand: `pnpm ${buildCommand.join(" ")}`,
    instrumented: true,
    profilingOptions: nodeOptions,
    restoredViteConfigSha256: config.restoredSha256,
    viteConfigBeforeProbeSha256: config.originalSha256,
    viteConfigWithProbeSha256: config.instrumentedSha256,
  })

  const verifierPath = path.join(homepage, "scripts/verify-build.mjs")
  const verifierEnv = {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=16384 --no-deprecation",
  }
  delete verifierEnv.ARDO_PROFILE_OUTPUT
  delete verifierEnv.ARDO_PROFILE_VITE_OUTPUT
  delete verifierEnv.ARDO_PROFILE_FRAMEWORK_OUTPUT
  delete verifierEnv.ARDO_PROFILE_NATIVE_OUTPUT
  delete verifierEnv.ARDO_PROFILE_PROJECT
  let verifierReceipt
  if (buildReceipt.exit.code === 0 && buildReceipt.exit.signal == null) {
    verifierReceipt = await runCommand(
      process.execPath,
      [verifierPath],
      homepage,
      verifierEnv,
      path.join(laneOutput, "verify.stdout.log"),
      path.join(laneOutput, "verify.stderr.log")
    )
    if (existsSync(path.join(homepage, "build/client"))) {
      cpSync(path.join(homepage, "build/client"), path.join(laneOutput, "client"), {
        recursive: true,
        errorOnExist: true,
      })
    }
  }
  if (verifierReceipt != null) writeJson(path.join(laneOutput, "verify.json"), verifierReceipt)

  const cacheAfter = inventory(cache)
  writeJson(path.join(laneOutput, "cache-after.json"), cacheAfter)
  const phases = instrumentationSummary(
    viteEventsPath,
    frameworkEventsPath,
    nativeEventsPath,
    cpuProfilePath
  )
  writeJson(path.join(laneOutput, "phase-summary.json"), phases)
  const result = {
    lane: laneName,
    homepage: path.relative(profileRoot, homepage),
    command: `pnpm ${buildCommand.join(" ")}`,
    build: buildReceipt,
    verifier: verifierReceipt ?? null,
    verifierSha256: digest(readFileSync(verifierPath)),
    originalVerifierSha256: digest(readFileSync(path.join(laneRoot, "verify-build.original.mjs"))),
    lockSha256: digest(readFileSync(path.join(homepage, "pnpm-lock.yaml"))),
    packageJsonSha256: digest(readFileSync(packageJsonPath)),
    packageJsonUnchanged: digest(readFileSync(packageJsonPath)) === packageBeforeSha256,
    lockUnchanged: digest(readFileSync(lockPath)) === lockBeforeSha256,
    cacheUnchanged: JSON.stringify(cacheBefore) === JSON.stringify(cacheAfter),
    cacheFiles: cacheAfter.length,
    phases,
  }
  if (buildReceipt.exit.code !== 0 || buildReceipt.exit.signal != null) {
    result.status = "failed-build"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} instrumented build failed: ${JSON.stringify(buildReceipt.exit)}.`)
  }
  if (verifierReceipt?.exit.code !== 0 || verifierReceipt?.exit.signal != null) {
    result.status = "failed-verifier"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} original build verifier failed.`)
  }
  if (!result.cacheUnchanged) {
    result.status = "cache-mutated"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic build changed the offline asset cache.`)
  }
  if (!result.packageJsonUnchanged || !result.lockUnchanged) {
    result.status = "manifest-or-lock-mutated"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic build changed its package manifest or lockfile.`)
  }
  if (!existsSync(path.join(laneOutput, "client"))) {
    result.status = "missing-output"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic did not retain build/client.`)
  }
  if (phases.vite.configResolvedCount < 1 || phases.vite.buildWindows.length < 1) {
    result.status = "missing-vite-events"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic did not capture Vite configuration/build phases.`)
  }
  if (phases.reactRouter.prerenderLifecycleWindows.length < 1) {
    result.status = "missing-framework-events"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic did not capture React Router prerender phases.`)
  }
  if (phases.cpuProfiles.count < 1) {
    result.status = "missing-cpu-profiles"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error(`${laneName} diagnostic did not retain a Node CPU profile.`)
  }
  if (laneName === "candidate") {
    if (
      phases.native.initializedProcesses.length < 1 ||
      Object.values(phases.native.phases).reduce((sum, phase) => sum + phase.calls, 0) < 1
    ) {
      result.status = "missing-native-events"
      writeJson(path.join(laneOutput, "diagnostic.json"), result)
      throw new Error("Candidate diagnostic did not capture native Ferromark compiler phases.")
    }
    if (phases.native.initializedProcesses.some((entry) => entry.engine.version !== "3.4.0")) {
      result.status = "unexpected-native-version"
      writeJson(path.join(laneOutput, "diagnostic.json"), result)
      throw new Error("Candidate native phase events came from an unexpected Ferromark version.")
    }
  } else if (
    phases.native.initializedProcesses.length > 0 ||
    Object.keys(phases.native.phases).length > 0
  ) {
    result.status = "unexpected-native-events"
    writeJson(path.join(laneOutput, "diagnostic.json"), result)
    throw new Error("Legacy Ardo 4.2 baseline unexpectedly loaded the native phase probe.")
  }
  result.status = "accepted-diagnostic"
  writeJson(path.join(laneOutput, "diagnostic.json"), result)
  return result
}

function validateInputs(prepared, setup, samples, fixturePath) {
  if (prepared.ardo?.sourceCommit !== expectedArdoSource) {
    throw new Error(`Prepared Ardo source must be ${expectedArdoSource}.`)
  }
  if (prepared.ferriki?.commit !== expectedFerrikiSource) {
    throw new Error(`Prepared Ferriki source must be ${expectedFerrikiSource}.`)
  }
  if (setup.ardoSourceCommit !== expectedArdoSource || setup.baselineLockUnchanged !== true) {
    throw new Error("Installed source or baseline lock receipt does not match the accepted series.")
  }
  if (
    setup.lanes?.baseline?.installedArdoVersion !== "4.2.0" ||
    setup.lanes?.candidate?.installedArdoVersion !== "5.0.0" ||
    setup.baselineNativeEnginePackagesAbsent !== true ||
    setup.candidateNativeEngineVersions?.["@ferriki/core"]?.length !== 1 ||
    setup.candidateNativeEngineVersions["@ferriki/core"][0] !== "0.13.0" ||
    setup.candidateNativeEngineVersions?.ferromark?.length !== 1 ||
    setup.candidateNativeEngineVersions.ferromark[0] !== "3.4.0"
  ) {
    throw new Error("Installed engine graph does not match the baseline/candidate setup contract.")
  }
  if (setup.lanes.baseline.lockSha256 !== expectedBaselineLockSha256) {
    throw new Error("Baseline setup receipt does not contain the pinned source lock.")
  }
  if (samples.length !== 12) {
    throw new Error(`Expected 12 accepted warm-up/pair samples; found ${samples.length}.`)
  }
  const counts = { baseline: 0, candidate: 0 }
  const names = new Set()
  for (const sample of samples) {
    if (
      !(sample.lane in counts) ||
      !Number.isFinite(sample.elapsedSeconds) ||
      sample.elapsedSeconds <= 0 ||
      !Number.isFinite(sample.maxRssBytes) ||
      sample.maxRssBytes <= 0
    ) {
      throw new Error("Accepted paired evidence contains an invalid or non-finite sample.")
    }
    counts[sample.lane]++
    names.add(`${sample.lane}\t${sample.name}`)
  }
  if (counts.baseline !== 6 || counts.candidate !== 6) {
    throw new Error(`Accepted sample counts are incomplete: ${JSON.stringify(counts)}.`)
  }
  for (const name of ["warmup", ...Array.from({ length: 5 }, (_, index) => `pair-${index + 1}`)]) {
    for (const lane of ["baseline", "candidate"]) {
      if (!names.has(`${lane}\t${name}`))
        throw new Error(`Accepted sample ${lane} ${name} is missing.`)
    }
  }
  if (digest(readFileSync(fixturePath)) !== expectedFixtureSha256) {
    throw new Error("Diagnostic fixture differs from the pinned Ferriki corpus.")
  }
}

try {
  prepared = readJson(path.join(profileRoot, "prepared.json"))
  setup = readJson(path.join(profileRoot, "setup-receipts.json"))
  samples = readJson(path.join(profileRoot, "evidence/samples.json"))
  pairedSemanticGate = readJson(path.join(profileRoot, "evidence/semantic-gate.json"))
  const fixturePath = path.resolve(
    profileRoot,
    prepared.lanes.candidate.homepage,
    "app/routes/evidence/compatibility.mdx"
  )
  validateInputs(prepared, setup, samples, fixturePath)
  if (
    pairedSemanticGate.schemaVersion !== 3 ||
    pairedSemanticGate.routeCoverage?.expectedRoutesPresentInBoth !== true
  ) {
    throw new Error("Paired-series semantic receipt is missing or incomplete.")
  }
  const version = execFileSync("pnpm", ["--version"], {
    encoding: "utf8",
    env: process.env,
  }).trim()
  if (version !== "10.34.5")
    throw new Error(`Phase diagnostics require pnpm 10.34.5; found ${version}.`)
  if (process.env.npm_config_manage_package_manager_versions?.toLowerCase() !== "false") {
    throw new Error("Disable pnpm package-manager auto-switching before phase diagnostics.")
  }

  for (const laneName of ["baseline", "candidate"]) {
    try {
      laneResults[laneName] = await runLane(laneName, prepared, setup)
    } catch (error) {
      const laneOutput = path.join(diagnosticRoot, laneName)
      laneResults[laneName] = {
        lane: laneName,
        status: "invalid-or-incomplete",
        error: error instanceof Error ? error.message : String(error),
      }
      if (existsSync(laneOutput))
        writeJson(path.join(laneOutput, "error.json"), laneResults[laneName])
      errors.push(laneResults[laneName].error)
    }
  }

  if (errors.length > 0) throw new Error("One or more instrumented lane diagnostics failed.")

  const comparatorPath = path.join(harnessRoot, "scripts/profiling/compare-ferriki-outputs.mjs")
  const baselineRoot = path.resolve(profileRoot, "lanes/baseline")
  const candidateRoot = path.resolve(profileRoot, "lanes/candidate")
  const baselineHomepage = path.resolve(profileRoot, prepared.lanes.baseline.homepage)
  const candidateHomepage = path.resolve(profileRoot, prepared.lanes.candidate.homepage)
  const comparatorReceiptPath = path.join(diagnosticRoot, "semantic-gate.json")
  const comparatorEnv = { ...process.env }
  delete comparatorEnv.ARDO_PROFILE_OUTPUT
  delete comparatorEnv.ARDO_PROFILE_VITE_OUTPUT
  delete comparatorEnv.ARDO_PROFILE_FRAMEWORK_OUTPUT
  delete comparatorEnv.ARDO_PROFILE_NATIVE_OUTPUT
  delete comparatorEnv.ARDO_PROFILE_PROJECT
  semanticGate = await runCommand(
    process.execPath,
    [
      comparatorPath,
      path.join(diagnosticRoot, "baseline/client"),
      path.join(diagnosticRoot, "candidate/client"),
      path.resolve(
        profileRoot,
        prepared.lanes.candidate.homepage,
        "app/routes/evidence/compatibility.mdx"
      ),
      comparatorReceiptPath,
      path.join(baselineHomepage, "scripts/verify-build.mjs"),
      path.join(candidateHomepage, "scripts/verify-build.mjs"),
      path.join(baselineRoot, "verify-build.original.mjs"),
      path.join(candidateRoot, "verify-build.original.mjs"),
    ],
    harnessRoot,
    comparatorEnv,
    path.join(diagnosticRoot, "semantic-gate.stdout.log"),
    path.join(diagnosticRoot, "semantic-gate.stderr.log")
  )
  if (semanticGate.exit.code !== 0 || semanticGate.exit.signal != null) {
    throw new Error("Common semantic comparator failed on the instrumented outputs.")
  }
  semanticGate.receiptSha256 = digest(readFileSync(comparatorReceiptPath))
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error))
} finally {
  for (const configPath of [...activeConfigs.keys()]) {
    try {
      restoreConfig(configPath)
    } catch (error) {
      errors.push(
        `Vite config restoration failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

const summary = {
  schemaVersion: 1,
  status: errors.length === 0 ? "accepted-diagnostic" : "invalid-or-incomplete",
  diagnosticRunStartedAt,
  diagnosticRunEndedAt: new Date().toISOString(),
  host: {
    platform: process.platform,
    architecture: process.arch,
    osRelease: os.release(),
    nodeVersion: process.version,
    harnessCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: harnessRoot,
      encoding: "utf8",
    }).trim(),
    ardoSourceCommit: expectedArdoSource,
    ferrikiSourceCommit: expectedFerrikiSource,
  },
  method: {
    runsPerLane: 1,
    timedSeriesAlreadyCompleted: true,
    probeInstrumentationEnabled: true,
    diagnosticWallTimesAreNotPairedPerformanceMeasurements: true,
    laneCommands: {
      baseline: "pnpm exec react-router build",
      candidate: "pnpm exec ardo build",
    },
    probeScope: {
      vite: "Both lanes, temporary Vite plugin injected into the prepared lane config.",
      reactRouter: "Both lanes, version-checked source hook around the prerender lifecycle.",
      native:
        "Candidate only; side-effect import in the candidate Vite config. Baseline has no native engine dependency.",
      cpuProfiles: "Node --cpu-prof enabled for instrumented diagnostic processes in both lanes.",
    },
    probeDurationsAreInclusive: true,
    sourceManifestAndLockFilesUnchanged:
      Object.keys(laneResults).length === 2 &&
      Object.values(laneResults).every(
        (lane) => lane.packageJsonUnchanged === true && lane.lockUnchanged === true
      ),
    cacheBytesVerifiedUnchanged:
      Object.keys(laneResults).length === 2 &&
      Object.values(laneResults).every((lane) => lane.cacheUnchanged === true),
  },
  pairedEvidence: {
    samples: samples?.length ?? null,
    semanticGateSchemaVersion: pairedSemanticGate?.schemaVersion ?? null,
  },
  lanes: laneResults,
  semanticGate: semanticGate ?? null,
  errors,
}
writeJson(path.join(diagnosticRoot, "diagnostic-summary.json"), summary)
if (errors.length > 0) {
  writeJson(path.join(diagnosticRoot, "attempt.json"), summary)
  throw new Error(`Phase diagnostics failed; raw evidence is retained at ${diagnosticRoot}.`)
}
console.log(JSON.stringify(summary, null, 2))
