import { createHash } from "node:crypto"
import { execFileSync, spawn } from "node:child_process"
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Each lane is an installed homepage directory with an adjacent verified cache.
const [
  baselineInput,
  candidateInput,
  outputInput,
  countInput = "5",
  candidateCommandInput = process.env.ARDO_PROFILE_CANDIDATE_COMMAND ?? "react-router",
  fixtureInput,
] = process.argv.slice(2)
if (!baselineInput || !candidateInput || !outputInput) {
  throw new Error(
    "Usage: node paired-builds.mjs BASELINE_HOMEPAGE CANDIDATE_HOMEPAGE OUTPUT [PAIRS] [react-router|ardo] [SEMANTIC_FIXTURE]"
  )
}
if (candidateCommandInput !== "react-router" && candidateCommandInput !== "ardo") {
  throw new Error("CANDIDATE_COMMAND must be react-router or ardo")
}
const lanes = { baseline: path.resolve(baselineInput), candidate: path.resolve(candidateInput) }
const commands = {
  baseline: ["exec", "react-router", "build"],
  candidate: ["exec", candidateCommandInput, "build"],
}
const output = path.resolve(outputInput)
const fixture = fixtureInput ? path.resolve(fixtureInput) : undefined
const pairs = Number(countInput)
if (!Number.isSafeInteger(pairs) || pairs < 1) throw new Error("PAIRS must be a positive integer")
mkdirSync(output)
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const samples = []
let semanticGateSha256
const contenderPattern =
  /(?:node|bun|rustc|cargo|clang|cc1|ld|pnpm|vite|esbuild|rolldown|python|chrom(?:e|ium)|firefox|webkit)/iu

function hostSnapshot(destination, lanePid) {
  const snapshot = execFileSync("ps", ["-Ao", "pid,ppid,pcpu,comm"], { encoding: "utf8" })
  writeFileSync(destination, snapshot)
  const rows = snapshot
    .split("\n")
    .map((line) => {
      const match = /^\s*(\d+)\s+(\d+)\s+([\d.,]+)\s+(.+)$/u.exec(line)
      if (!match) return undefined
      return {
        pid: Number(match[1]),
        ppid: Number(match[2]),
        cpuPercent: Number(match[3].replace(",", ".")),
        command: match[4].trim(),
      }
    })
    .filter((row) => row !== undefined)
  const ownPids = new Set([process.pid, ...(lanePid == null ? [] : [lanePid])])
  let changed = true
  while (changed) {
    changed = false
    for (const row of rows) {
      if (ownPids.has(row.ppid) && !ownPids.has(row.pid)) {
        ownPids.add(row.pid)
        changed = true
      }
    }
  }
  return {
    recordedAt: new Date().toISOString(),
    processCount: rows.length,
    competing: rows.filter(
      (row) => !ownPids.has(row.pid) && row.cpuPercent > 15 && contenderPattern.test(row.command)
    ),
  }
}

function recordHostSnapshot(destination, lanePid) {
  const record = hostSnapshot(destination, lanePid)
  appendFileSync(
    path.join(path.dirname(destination), "host-monitor.ndjson"),
    `${JSON.stringify(record)}\n`
  )
  return record
}

function inventory(directory, relative = "") {
  return readdirSync(path.join(directory, relative), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(relative, entry.name)
    if (entry.isDirectory()) return inventory(directory, file)
    const bytes = readFileSync(path.join(directory, file))
    return [{ path: file, bytes: bytes.length, sha256: digest(bytes) }]
  })
}

async function runBuild(lane, name, destination) {
  const command = commands[lane]
  const args = ["-l", "-o", path.join(destination, "time.txt"), "pnpm", ...command]
  const stdout = []
  const stderr = []
  const child = spawn("/usr/bin/time", args, {
    cwd: lanes[lane],
    env: {
      ...process.env,
      NODE_OPTIONS: "--max-old-space-size=16384 --no-deprecation",
      FERRIKI_CACHE_DIR: path.resolve(lanes[lane], "../cache"),
      FERRIKI_ASSETS_REMOTE: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.stdout.on("data", (chunk) => stdout.push(chunk))
  child.stderr.on("data", (chunk) => stderr.push(chunk))

  const monitorFailures = []
  let monitorChecks = 0
  const monitor = setInterval(() => {
    try {
      const record = recordHostSnapshot(path.join(destination, "host-during.txt"), child.pid)
      monitorChecks++
      if (record.competing.length > 0) monitorFailures.push(record)
    } catch (error) {
      monitorFailures.push({
        recordedAt: new Date().toISOString(),
        monitorError: error instanceof Error ? error.message : String(error),
      })
    }
  }, 1000)

  let exit
  try {
    exit = await new Promise((resolve, reject) => {
      child.once("error", reject)
      child.once("close", (code, signal) => resolve({ code, signal }))
    })
  } finally {
    clearInterval(monitor)
  }
  const log = path.join(destination, "build.log")
  writeFileSync(log, Buffer.concat([...stdout, ...stderr]))
  const after = recordHostSnapshot(path.join(destination, "host-after.txt"), child.pid)
  if (after.competing.length > 0) monitorFailures.push(after)
  const guard = {
    command: `pnpm ${command.join(" ")}`,
    exit,
    monitorIntervalMs: 1000,
    monitorChecks,
    monitorFailures,
    postBuildCompetitors: after.competing,
  }
  writeFileSync(path.join(destination, "guard.json"), `${JSON.stringify(guard, null, 2)}\n`)
  if (monitorFailures.length > 0 || after.competing.length > 0) {
    throw new Error(
      `Sample rejected after competing heavy work during ${name} ${lane}; raw timer and guard evidence are retained.`
    )
  }
  if (exit.code !== 0 || exit.signal != null) {
    throw new Error(`Build failed (${JSON.stringify(exit)}); retain ${destination}`)
  }
  return { log, command: guard.command }
}

async function build(lane, name) {
  const cwd = lanes[lane]
  const destination = path.join(output, `${name}-${lane}`)
  mkdirSync(destination)
  const before = recordHostSnapshot(path.join(destination, "host-before.txt"))
  if (before.competing.length > 0) {
    writeFileSync(
      path.join(destination, "guard.json"),
      `${JSON.stringify({ stage: "before", competitors: before.competing }, null, 2)}\n`
    )
    throw new Error(`Competing heavy work before ${name} ${lane}; no timing collected.`)
  }
  const cache = path.resolve(cwd, "../cache")
  const cacheBefore = inventory(cache)
  rmSync(path.join(cwd, "build"), { recursive: true, force: true })
  const { log, command } = await runBuild(lane, name, destination)
  const verification = spawn("node", ["scripts/verify-build.mjs"], {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const verificationOutput = []
  verification.stdout.on("data", (chunk) => verificationOutput.push(chunk))
  verification.stderr.on("data", (chunk) => verificationOutput.push(chunk))
  const verificationExit = await new Promise((resolve, reject) => {
    verification.once("error", reject)
    verification.once("close", (code, signal) => resolve({ code, signal }))
  })
  const verificationText = Buffer.concat(verificationOutput)
  writeFileSync(path.join(destination, "verify.log"), verificationText)
  if (verificationExit.code !== 0 || verificationExit.signal != null) {
    throw new Error(`Output verification failed; retain ${destination}`)
  }
  const cacheAfter = inventory(cache)
  if (JSON.stringify(cacheBefore) !== JSON.stringify(cacheAfter))
    throw new Error("Offline asset cache changed")
  cpSync(path.join(cwd, "build/client"), path.join(destination, "client"), { recursive: true })
  const raw = readFileSync(path.join(destination, "time.txt"), "utf8")
  const elapsedSeconds = Number(/([\d.]+) real/u.exec(raw)?.[1])
  const maxRssBytes = Number(/(\d+)\s+maximum resident set size/u.exec(raw)?.[1])
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    throw new Error(`Could not parse positive elapsed time; retain ${destination}`)
  }
  if (!Number.isFinite(maxRssBytes) || maxRssBytes <= 0) {
    throw new Error(`Could not parse positive maximum RSS; retain ${destination}`)
  }
  const sample = {
    lane,
    name,
    command,
    monitorIntervalMs: 1000,
    monitorChecks: JSON.parse(readFileSync(path.join(destination, "guard.json"), "utf8"))
      .monitorChecks,
    elapsedSeconds,
    maxRssBytes,
    maxRssMiB: maxRssBytes / 1024 / 1024,
    rawTime: raw,
    lockSha256: digest(readFileSync(path.join(cwd, "pnpm-lock.yaml"))),
    cache: cacheAfter,
    outputs: inventory(path.join(destination, "client")),
    logSha256: digest(readFileSync(log)),
    verificationSha256: digest(readFileSync(path.join(destination, "verify.log"))),
    hostMonitorSha256: digest(readFileSync(path.join(destination, "host-monitor.ndjson"))),
    ...(semanticGateSha256 ? { semanticGateSha256 } : {}),
  }
  samples.push(sample)
  writeFileSync(path.join(output, "samples.json"), `${JSON.stringify(samples, null, 2)}\n`)
  console.log(`${name} ${lane}: ${sample.elapsedSeconds}s, ${sample.maxRssMiB.toFixed(2)} MiB`)
  return destination
}

async function runSemanticGate(baselineOutput, candidateOutput) {
  if (fixture === undefined) return
  const receiptPath = path.join(output, "semantic-gate.json")
  const logPath = path.join(output, "semantic-gate.log")
  const scriptPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "compare-ferriki-outputs.mjs"
  )
  const child = spawn(
    process.execPath,
    [
      scriptPath,
      path.join(baselineOutput, "client"),
      path.join(candidateOutput, "client"),
      fixture,
      receiptPath,
      path.join(lanes.baseline, "scripts/verify-build.mjs"),
      path.join(lanes.candidate, "scripts/verify-build.mjs"),
      path.resolve(lanes.baseline, "../verify-build.original.mjs"),
      path.resolve(lanes.candidate, "../verify-build.original.mjs"),
    ],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] }
  )
  const chunks = []
  child.stdout.on("data", (chunk) => chunks.push(chunk))
  child.stderr.on("data", (chunk) => chunks.push(chunk))
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (code, signal) => resolve({ code, signal }))
  })
  const log = Buffer.concat(chunks)
  writeFileSync(logPath, log)
  if (result.code !== 0 || result.signal != null) {
    throw new Error(`Common output semantics gate failed; retain ${logPath}.`)
  }
  semanticGateSha256 = digest(readFileSync(receiptPath))
  for (const sample of samples) {
    if (sample.name === "warmup") sample.semanticGateSha256 = semanticGateSha256
  }
  writeFileSync(path.join(output, "samples.json"), `${JSON.stringify(samples, null, 2)}\n`)
}

try {
  const baselineWarmup = await build("baseline", "warmup")
  const candidateWarmup = await build("candidate", "warmup")
  await runSemanticGate(baselineWarmup, candidateWarmup)
  for (let index = 1; index <= pairs; index++) {
    // Alternate pair order as well as lanes to reduce order bias.
    for (const lane of index % 2 ? ["baseline", "candidate"] : ["candidate", "baseline"])
      await build(lane, `pair-${index}`)
  }
} catch (error) {
  writeFileSync(
    path.join(output, "attempt.json"),
    `${JSON.stringify(
      {
        status: "invalid-or-incomplete",
        recordedAt: new Date().toISOString(),
        completedSamples: samples.length,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )}\n`
  )
  throw error
}
