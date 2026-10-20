import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [outputInput, baselineInput, candidateInput] = process.argv.slice(2)
if (!outputInput || !baselineInput || !candidateInput) {
  throw new Error(
    "Usage: node record-blacksmith-setup.mjs OUTPUT BASELINE_HOMEPAGE CANDIDATE_HOMEPAGE"
  )
}

const expectedArdoSource = "493e53405e906fbc051d9e9d7a9d00a7d338a642"
const expectedSeedLockSha256 = "1e00152c77342c2f6a41b77fc58f5d9a779bb63d79b91d6bb1f3d31b7a393a96"
const expectedFerrikiPackageManager =
  "pnpm@10.34.5+sha512.a4ee05f2f73658255bd6a89859c065a45c28a57daefae2c893a168ee2b73168c37b91e83e57ea67654ad03f03031746430e8bce38e362e042605fb8abc80192e"
const output = path.resolve(outputInput)
const ardoRoot = path.resolve(process.env.ARDO_SOURCE_ROOT ?? ".")
const pnpm = process.env.PROFILE_PNPM_BIN
if (!pnpm) throw new Error("PROFILE_PNPM_BIN must name the explicitly installed consumer pnpm.")
if (process.env.npm_config_manage_package_manager_versions?.toLowerCase() !== "false") {
  throw new Error(
    "npm_config_manage_package_manager_versions=false is required to prevent pnpm auto-switching."
  )
}

const ardoSourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ardoRoot,
  encoding: "utf8",
}).trim()
if (ardoSourceCommit !== expectedArdoSource) {
  throw new Error(`Ardo source must be ${expectedArdoSource}; found ${ardoSourceCommit}.`)
}
const yamlRequire = createRequire(path.join(ardoRoot, "packages/ardo/package.json"))
const { parse } = yamlRequire("yaml")
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const relevantPackage = (name) =>
  [
    "ardo",
    "@ferriki/core",
    "ferromark",
    "@react-router/dev",
    "react-router",
    "vite",
    "@mdx-js/rollup",
  ].includes(name) ||
  name.startsWith("@ferriki/") ||
  name.startsWith("ferromark-")
const baseVersion = (reference) => reference.split("(")[0]
const peerContext = (reference) => reference.slice(reference.indexOf("("))

function packageKey(key) {
  const separator = key.startsWith("@") ? key.indexOf("@", key.indexOf("/") + 1) : key.indexOf("@")
  if (separator <= 0) return { name: key, reference: "" }
  return { name: key.slice(0, separator), reference: key.slice(separator + 1) }
}

function directDependencies(importer) {
  const direct = new Map()
  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, record] of Object.entries(importer[section] ?? {})) {
      if (typeof record?.specifier !== "string" || typeof record?.version !== "string") {
        throw new Error(`Lock importer has an invalid ${section} entry for ${name}.`)
      }
      if (direct.has(name)) throw new Error(`Lock importer repeats direct dependency ${name}.`)
      direct.set(name, { specifier: record.specifier, version: record.version, section })
    }
  }
  return direct
}

function installedVersion(homepage, packageName) {
  const packageJsonPath = path.join(
    homepage,
    "node_modules",
    ...packageName.split("/"),
    "package.json"
  )
  return JSON.parse(readFileSync(packageJsonPath, "utf8")).version
}

function recordLane(name, input) {
  const homepage = path.resolve(input)
  const packageJson = JSON.parse(readFileSync(path.join(homepage, "package.json"), "utf8"))
  if (packageJson.packageManager !== expectedFerrikiPackageManager) {
    throw new Error(`${name} packageManager changed: ${packageJson.packageManager}.`)
  }
  const lockBytes = readFileSync(path.join(homepage, "pnpm-lock.yaml"))
  const lockSha256 = digest(lockBytes)
  if (name === "baseline" && lockSha256 !== expectedSeedLockSha256) {
    throw new Error(`Baseline must preserve the source676 seed lock; found ${lockSha256}.`)
  }
  const lock = parse(lockBytes.toString("utf8"))
  const importer = lock.importers?.["."]
  if (!importer) throw new Error(`${name} lockfile is missing the homepage importer.`)
  const direct = directDependencies(importer)
  const packageArdoSpecifier = packageJson.dependencies?.ardo
  const importerArdo = direct.get("ardo")
  if (!importerArdo || importerArdo.specifier !== packageArdoSpecifier) {
    throw new Error(`${name} manifest and lockfile disagree about the Ardo dependency.`)
  }
  const expectedArdoSpecifier = name === "baseline" ? "^4.2.0" : "file:../../../ardo-5.0.0.tgz"
  if (packageArdoSpecifier !== expectedArdoSpecifier) {
    throw new Error(`${name} must use ${expectedArdoSpecifier}; found ${packageArdoSpecifier}.`)
  }
  const pnpmVersion = execFileSync(pnpm, ["--version"], {
    cwd: homepage,
    encoding: "utf8",
    env: process.env,
  }).trim()
  if (pnpmVersion !== "10.34.5") {
    throw new Error(`${name} must use pnpm 10.34.5; found ${pnpmVersion}.`)
  }

  const ardoVersion = installedVersion(homepage, "ardo")
  const expectedInstalledArdo = name === "baseline" ? "4.2.0" : "5.0.0"
  if (ardoVersion !== expectedInstalledArdo) {
    throw new Error(
      `${name} installed Ardo must be ${expectedInstalledArdo}; found ${ardoVersion}.`
    )
  }
  const packages = Object.keys(lock.packages ?? {})
    .map((key) => ({ key, ...packageKey(key) }))
    .filter(({ name: packageName }) => relevantPackage(packageName))
    .sort((left, right) => left.key.localeCompare(right.key))
  const snapshots = Object.keys(lock.snapshots ?? {})
    .map((key) => ({ key, ...packageKey(key) }))
    .filter(({ name: packageName }) => relevantPackage(packageName))
    .sort((left, right) => left.key.localeCompare(right.key))
  const resolvedBaseVersions = (packageName) =>
    packages
      .filter((entry) => entry.name === packageName)
      .map((entry) => entry.reference.split("(")[0])
      .sort()

  return {
    homepage: path.relative(output, homepage),
    nodeVersion: process.version,
    pnpmVersion,
    packageManager: packageJson.packageManager,
    npmConfigManagePackageManagerVersions: process.env.npm_config_manage_package_manager_versions,
    ardoSpecifier: packageArdoSpecifier,
    installedArdoVersion: ardoVersion,
    lockSha256,
    importer,
    directDependencies: Object.fromEntries(
      [...direct.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
    resolvedPackages: packages,
    resolvedSnapshots: snapshots,
    resolvedFerrikiCoreVersions: resolvedBaseVersions("@ferriki/core"),
    resolvedFerromarkVersions: resolvedBaseVersions("ferromark"),
    nativeOverrides: packageJson.pnpm?.overrides ?? {},
  }
}

const baseline = recordLane("baseline", baselineInput)
const candidate = recordLane("candidate", candidateInput)
const baselineDirect = baseline.directDependencies
const candidateDirect = candidate.directDependencies
const directNames = [...new Set([...Object.keys(baselineDirect), ...Object.keys(candidateDirect)])]
  .filter((name) => name !== "ardo")
  .sort()
const directDependencyDifferences = directNames.flatMap((name) => {
  const before = baselineDirect[name]
  const after = candidateDirect[name]
  if (
    !before ||
    !after ||
    before.specifier !== after.specifier ||
    baseVersion(before.version) !== baseVersion(after.version)
  ) {
    return [{ name, baseline: before ?? null, candidate: after ?? null }]
  }
  return []
})
if (directDependencyDifferences.length > 0) {
  throw new Error(
    `Shared Ferriki direct dependencies drifted between lanes: ${JSON.stringify(directDependencyDifferences)}.`
  )
}
const directDependencyPeerContextDifferences = directNames.flatMap((name) => {
  const before = baselineDirect[name]
  const after = candidateDirect[name]
  if (
    before &&
    after &&
    baseVersion(before.version) === baseVersion(after.version) &&
    peerContext(before.version) !== peerContext(after.version)
  ) {
    return [{ name, baseline: before.version, candidate: after.version }]
  }
  return []
})
if (
  baseline.resolvedFerrikiCoreVersions.length !== 0 ||
  baseline.resolvedFerromarkVersions.length !== 0
) {
  throw new Error(
    `Legacy Ardo 4.2 baseline must not contain native Ferriki engines; found core ${JSON.stringify(baseline.resolvedFerrikiCoreVersions)} and ferromark ${JSON.stringify(baseline.resolvedFerromarkVersions)}.`
  )
}
if (JSON.stringify(candidate.resolvedFerrikiCoreVersions) !== JSON.stringify(["0.13.0"])) {
  throw new Error(
    `Candidate must resolve only @ferriki/core 0.13.0; found ${JSON.stringify(candidate.resolvedFerrikiCoreVersions)}.`
  )
}
if (JSON.stringify(candidate.resolvedFerromarkVersions) !== JSON.stringify(["3.4.0"])) {
  throw new Error(
    `Candidate must resolve only ferromark 3.4.0; found ${JSON.stringify(candidate.resolvedFerromarkVersions)}.`
  )
}
if (
  candidate.nativeOverrides["@ferriki/core"] !== "0.13.0" ||
  candidate.nativeOverrides.ferromark !== "3.4.0"
) {
  throw new Error(
    "Candidate native engine overrides must pin @ferriki/core 0.13.0 and ferromark 3.4.0."
  )
}

const receipt = {
  schemaVersion: 2,
  ardoSourceCommit,
  seedLockSha256: expectedSeedLockSha256,
  baselineLockUnchanged: baseline.lockSha256 === expectedSeedLockSha256,
  sharedDirectDependencyVersionsMatch: true,
  directDependencyDifferences,
  directDependencyPeerContextDifferences,
  baselineNativeEnginePackagesAbsent: true,
  candidateNativeEngineVersions: {
    "@ferriki/core": candidate.resolvedFerrikiCoreVersions,
    ferromark: candidate.resolvedFerromarkVersions,
  },
  lanes: { baseline, candidate },
}
writeFileSync(path.join(output, "setup-receipts.json"), `${JSON.stringify(receipt, null, 2)}\n`, {
  flag: "wx",
})
console.log(JSON.stringify(receipt, null, 2))
