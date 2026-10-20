import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

// Each lane is an installed homepage directory with an adjacent verified cache.
const [baselineInput, candidateInput, outputInput, countInput = "5"] = process.argv.slice(2)
if (!baselineInput || !candidateInput || !outputInput)
  throw new Error(
    "Usage: node paired-builds.mjs BASELINE_HOMEPAGE CANDIDATE_HOMEPAGE OUTPUT [PAIRS]"
  )
const lanes = { baseline: path.resolve(baselineInput), candidate: path.resolve(candidateInput) }
const output = path.resolve(outputInput)
const pairs = Number(countInput)
if (!Number.isSafeInteger(pairs) || pairs < 1) throw new Error("PAIRS must be a positive integer")
mkdirSync(output, { recursive: true })
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const snapshots = []

function assertQuiet(destination) {
  const snapshot = execFileSync("ps", ["-Ao", "pid,pcpu,comm"], { encoding: "utf8" })
  writeFileSync(destination, snapshot)
  const competing = snapshot.split("\n").filter((line) => {
    const match = /^\s*(\d+)\s+([\d.,]+)\s+(.+)$/u.exec(line)
    return (
      match &&
      Number(match[1]) !== process.pid &&
      Number(match[2].replace(",", ".")) > 15 &&
      /(?:node|bun|rustc|cargo|clang|cc1|ld|pnpm|vite|esbuild|rolldown|python)/u.test(match[3])
    )
  })
  if (competing.length)
    throw new Error(`Competing heavy work; no timing collected:\n${competing.join("\n")}`)
}

function inventory(directory, relative = "") {
  return readdirSync(path.join(directory, relative), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(relative, entry.name)
    if (entry.isDirectory()) return inventory(directory, file)
    const bytes = readFileSync(path.join(directory, file))
    return [{ path: file, bytes: bytes.length, sha256: digest(bytes) }]
  })
}

function build(lane, name) {
  const cwd = lanes[lane]
  const destination = path.join(output, `${name}-${lane}`)
  mkdirSync(destination, { recursive: true })
  assertQuiet(path.join(destination, "host-before.txt"))
  const cache = path.resolve(cwd, "../cache")
  const before = inventory(cache)
  rmSync(path.join(cwd, "build"), { recursive: true, force: true })
  const log = path.join(destination, "build.log")
  const command = spawnSync(
    "/usr/bin/time",
    ["-l", "-o", path.join(destination, "time.txt"), "pnpm", "exec", "react-router", "build"],
    {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: {
        ...process.env,
        NODE_OPTIONS: "--max-old-space-size=16384 --no-deprecation",
        FERRIKI_CACHE_DIR: cache,
        FERRIKI_ASSETS_REMOTE: "0",
      },
    }
  )
  writeFileSync(log, `${command.stdout ?? ""}${command.stderr ?? ""}`)
  if (command.status !== 0) throw new Error(`Build failed; retain ${destination}`)
  const verification = spawnSync("node", ["scripts/verify-build.mjs"], { cwd, encoding: "utf8" })
  writeFileSync(
    path.join(destination, "verify.log"),
    `${verification.stdout}${verification.stderr}`
  )
  if (verification.status !== 0)
    throw new Error(`Output verification failed; retain ${destination}`)
  const after = inventory(cache)
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Offline asset cache changed")
  cpSync(path.join(cwd, "build/client"), path.join(destination, "client"), { recursive: true })
  const raw = readFileSync(path.join(destination, "time.txt"), "utf8")
  const sample = {
    lane,
    name,
    elapsedSeconds: Number(/([\d.]+) real/u.exec(raw)?.[1]),
    maxRssMiB: Number(/(\d+)\s+maximum resident set size/u.exec(raw)?.[1]) / 1024 / 1024,
    rawTime: raw,
    lockSha256: digest(readFileSync(path.join(cwd, "pnpm-lock.yaml"))),
    cache: after,
    outputs: inventory(path.join(destination, "client")),
    logSha256: digest(readFileSync(log)),
  }
  snapshots.push(sample)
  writeFileSync(path.join(output, "samples.json"), `${JSON.stringify(snapshots, null, 2)}\n`)
  console.log(`${name} ${lane}: ${sample.elapsedSeconds}s, ${sample.maxRssMiB.toFixed(2)} MiB`)
}

for (const lane of Object.keys(lanes)) build(lane, "warmup")
for (let index = 1; index <= pairs; index++) {
  // Alternate pair order as well as lanes to reduce order bias.
  for (const lane of index % 2 ? ["baseline", "candidate"] : ["candidate", "baseline"])
    build(lane, `pair-${index}`)
}
