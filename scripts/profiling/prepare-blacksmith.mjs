import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

const [outputInput, ferrikiInput, tarballInput] = process.argv.slice(2)
if (!outputInput || !ferrikiInput || !tarballInput) {
  throw new Error("Usage: node prepare-blacksmith.mjs OUTPUT FERRIKI_SOURCE ARDO_TARBALL")
}

const expectedFerrikiCommit = "676b8e953e6597a337fc644e712a4a30e5b8bea5"
const expectedArdoCommit = "493e53405e906fbc051d9e9d7a9d00a7d338a642"
const expectedLockSha256 = "1e00152c77342c2f6a41b77fc58f5d9a779bb63d79b91d6bb1f3d31b7a393a96"
const expectedFixtureSha256 = "be71440bb815f448cacd039ff2909139f6b2099b7036d82fc321105122a00d04"
const expectedManifestSha256 = "30ca207f07ee8616369ffb8e5c6456195abca74d56de6a106a87cf99cd83debf"
const expectedViteConfigSha256 = "395d4e5805e4ee6e13d5448fcb9f736acaa4175bdc9db888072af8aa9cff4c90"
const expectedAdaptedViteConfigSha256 =
  "1b55985ea551e62d00a8041a4af368d0135a9a720be90d11d1e661a06e8eacf7"
const expectedVerifierSha256 = "e9672c9bb29e5dbf41b5d4fe57bd4c81744f9f3c441b4de8e8423e73ee424d93"
const expectedAdaptedVerifierSha256 =
  "b137a915b3b94484360e41f87ee56ef2c6b9985b0bbfaf85996c9d05f24dfbe1"
const expectedNativeAcceptanceSha256 =
  "e7125c7e41fd04d65f301ce88195b01c781e8b034b0db042041378b1ae395e33"
const expectedPackageMetadataSha256 =
  "a93ea8f242794822b9ac1c35d85c8d1287538fc99d775a26824a9b800c15dc1d"
const expectedBenchmarkReportSha256 =
  "8f771ca9caae4dfd563cc41a9b7c890907f6bdc07d9f7374bb157efe1088fafe"
const removedNativeAssertion =
  'verifyArdoAcceptanceHtml(await read("evidence/compatibility/index.html"));'
const output = path.resolve(outputInput)
const ferriki = path.resolve(ferrikiInput)
const tarball = path.resolve(tarballInput)
const ardoSourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: process.cwd(),
  encoding: "utf8",
}).trim()
if (ardoSourceCommit !== expectedArdoCommit) {
  throw new Error(`Ardo source must be ${expectedArdoCommit}; found ${ardoSourceCommit}.`)
}
const ferrikiCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ferriki,
  encoding: "utf8",
}).trim()
if (ferrikiCommit !== expectedFerrikiCommit) {
  throw new Error(`Ferriki source must be ${expectedFerrikiCommit}; found ${ferrikiCommit}.`)
}

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const assertDigest = (bytes, expected, label) => {
  const actual = digest(bytes)
  if (actual !== expected) throw new Error(`${label} hash mismatch: ${actual}.`)
  return actual
}
const lockPath = path.join(ferriki, "homepage", "pnpm-lock.yaml")
const lockBytes = readFileSync(lockPath)
const lockSha256 = assertDigest(lockBytes, expectedLockSha256, "Ferriki source lock")
const packageJsonPath = path.join(ferriki, "homepage", "package.json")
const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
if (originalPackageJson.dependencies?.ardo !== "^5.0.0") {
  throw new Error("Ferriki source manifest no longer has the expected Ardo 5 dependency.")
}
if (
  originalPackageJson.packageManager !==
  "pnpm@10.34.5+sha512.a4ee05f2f73658255bd6a89859c065a45c28a57daefae2c893a168ee2b73168c37b91e83e57ea67654ad03f03031746430e8bce38e362e042605fb8abc80192e"
) {
  throw new Error(
    "Ferriki source packageManager changed; review the consumer toolchain before profiling."
  )
}

const fixturePath = path.join(ferriki, "homepage", "app", "routes", "evidence", "compatibility.mdx")
const fixtureSha256 = assertDigest(
  readFileSync(fixturePath),
  expectedFixtureSha256,
  "Ferriki compatibility corpus"
)
const manifestPath = path.join(ferriki, "assets", "shiki", "release-manifest.json")
const manifestBytes = readFileSync(manifestPath)
const manifest = JSON.parse(manifestBytes)
const manifestSha256 = assertDigest(manifestBytes, expectedManifestSha256, "Ferriki asset manifest")
const manifestBytesTotal = Object.values(manifest.assets ?? {}).reduce(
  (sum, asset) => sum + asset.size,
  0
)
if (
  manifest.manifestVersion !== 1 ||
  Object.keys(manifest.assets ?? {}).length !== 325 ||
  manifestBytesTotal !== 9_006_563
) {
  throw new Error("Unexpected Ferriki release manifest version or asset count.")
}

const sourceVitePath = path.join(ferriki, "homepage", "vite.config.ts")
const sourceViteBytes = readFileSync(sourceVitePath)
const sourceViteSha256 = assertDigest(
  sourceViteBytes,
  expectedViteConfigSha256,
  "Ferriki Vite config"
)
const sourceVerifierPath = path.join(ferriki, "homepage", "scripts", "verify-build.mjs")
const sourceVerifierBytes = readFileSync(sourceVerifierPath)
const sourceVerifierSha256 = assertDigest(
  sourceVerifierBytes,
  expectedVerifierSha256,
  "Ferriki build verifier"
)
const sourceNativeAcceptancePath = path.join(
  ferriki,
  "homepage",
  "scripts",
  "verify-ardo-acceptance.mjs"
)
const sourceNativeAcceptanceBytes = readFileSync(sourceNativeAcceptancePath)
const sourceNativeAcceptanceSha256 = assertDigest(
  sourceNativeAcceptanceBytes,
  expectedNativeAcceptanceSha256,
  "Ferriki native acceptance verifier"
)

const packageMetadataPath = path.join(ferriki, "node", "ferriki", "package.json")
const packageMetadataBytes = readFileSync(packageMetadataPath)
const packageMetadataSha256 = assertDigest(
  packageMetadataBytes,
  expectedPackageMetadataSha256,
  "Ferriki sibling package metadata"
)
const benchmarkReportPath = path.join(ferriki, "docs", "benchmarks", "shiki-comparison.json")
const benchmarkReportBytes = readFileSync(benchmarkReportPath)
const benchmarkReportSha256 = assertDigest(
  benchmarkReportBytes,
  expectedBenchmarkReportSha256,
  "Ferriki sibling benchmark report"
)

// mkdirSync without recursive preserves every attempt and rejects output reuse.
mkdirSync(output)
const ardoPackage = JSON.parse(readFileSync(path.resolve("packages/ardo/package.json"), "utf8"))
if (ardoPackage.version !== "5.0.0") {
  throw new Error(`Expected packed Ardo 5.0.0; found ${ardoPackage.version}.`)
}
const tarballBytes = readFileSync(tarball)
const packedTarball = path.join(output, "ardo-5.0.0.tgz")
writeFileSync(packedTarball, tarballBytes, { flag: "wx" })

const adaptViteConfig = (homepage, laneRoot) => {
  const vitePath = path.join(homepage, "vite.config.ts")
  const original = readFileSync(vitePath, "utf8")
  const providerAnchor =
    'const ferrikiMdxProvider = fileURLToPath(new URL("app/mdx-provider.tsx", import.meta.url));\n'
  const resolveAnchor = "  resolveId(source, importer) {\n"
  if (original.split(providerAnchor).length !== 2 || original.split(resolveAnchor).length !== 2) {
    throw new Error("Ferriki Vite config no longer matches the reviewed resolver adapter anchors.")
  }
  const adapted = original
    .replace(
      providerAnchor,
      `${providerAnchor}const ferrikiPackage = fileURLToPath(new URL("node/ferriki/package.json", import.meta.url));\nconst ferrikiBenchmarkReport = fileURLToPath(new URL("docs/benchmarks/shiki-comparison.json", import.meta.url));\n`
    )
    .replace(
      resolveAnchor,
      `${resolveAnchor}    if (source === "../../node/ferriki/package.json") return ferrikiPackage;\n    if (source === "../../../docs/benchmarks/shiki-comparison.json") return ferrikiBenchmarkReport;\n`
    )
  const adaptedSha256 = assertDigest(
    Buffer.from(adapted),
    expectedAdaptedViteConfigSha256,
    "Adapted Ferriki Vite config"
  )
  writeFileSync(path.join(laneRoot, "vite.config.original.ts"), original, { flag: "wx" })
  writeFileSync(vitePath, adapted)
  return { originalSha256: digest(Buffer.from(original)), adaptedSha256 }
}

const adaptVerifier = (homepage, laneRoot, laneName) => {
  const verifierPath = path.join(homepage, "scripts", "verify-build.mjs")
  const original = readFileSync(verifierPath, "utf8")
  const assertionCount = original.split(removedNativeAssertion).length - 1
  if (assertionCount !== 1 || !original.includes(`${removedNativeAssertion}\n`)) {
    throw new Error(`Expected exactly one native-only verifier assertion; found ${assertionCount}.`)
  }
  const adapted =
    laneName === "baseline" ? original.replace(`${removedNativeAssertion}\n`, "") : original
  const adaptedSha256 =
    laneName === "baseline"
      ? assertDigest(
          Buffer.from(adapted),
          expectedAdaptedVerifierSha256,
          "Adapted legacy Ferriki build verifier"
        )
      : assertDigest(
          Buffer.from(adapted),
          expectedVerifierSha256,
          "Candidate Ferriki build verifier"
        )
  writeFileSync(path.join(laneRoot, "verify-build.original.mjs"), original, { flag: "wx" })
  if (laneName === "baseline") writeFileSync(verifierPath, adapted)
  const nativeAcceptancePath = path.join(homepage, "scripts", "verify-ardo-acceptance.mjs")
  const nativeAcceptanceSha256 = assertDigest(
    readFileSync(nativeAcceptancePath),
    expectedNativeAcceptanceSha256,
    `${laneName} Ferriki native acceptance verifier`
  )
  return {
    lane: laneName,
    originalSha256: digest(Buffer.from(original)),
    adaptedSha256,
    removedAssertion: laneName === "baseline" ? removedNativeAssertion : null,
    nativeAcceptanceVerifierSha256: nativeAcceptanceSha256,
    nativeCandidateGate:
      laneName === "candidate"
        ? "Original verify-build.mjs runs verify-ardo-acceptance.mjs after every candidate build."
        : "Legacy baseline skips the native-only assertion; common output semantics are checked separately.",
  }
}

const copySiblings = (laneRoot, homepage) => {
  const copies = [
    ["node/ferriki/package.json", packageMetadataBytes],
    ["docs/benchmarks/shiki-comparison.json", benchmarkReportBytes],
  ]
  for (const [relativePath, bytes] of copies) {
    for (const root of [laneRoot, homepage]) {
      const destination = path.join(root, relativePath)
      mkdirSync(path.dirname(destination), { recursive: true })
      if (existsSync(destination)) {
        if (!readFileSync(destination).equals(bytes)) {
          throw new Error(
            `Ferriki sibling input conflicts with the pinned source: ${relativePath}.`
          )
        }
      } else {
        writeFileSync(destination, bytes, { flag: "wx" })
      }
    }
  }
  const laneRootPackageBytes = readFileSync(path.join(laneRoot, "node/ferriki/package.json"))
  const homepagePackageBytes = readFileSync(path.join(homepage, "node/ferriki/package.json"))
  const laneRootReportBytes = readFileSync(
    path.join(laneRoot, "docs/benchmarks/shiki-comparison.json")
  )
  const homepageReportBytes = readFileSync(
    path.join(homepage, "docs/benchmarks/shiki-comparison.json")
  )
  if (
    !laneRootPackageBytes.equals(homepagePackageBytes) ||
    !laneRootReportBytes.equals(homepageReportBytes)
  ) {
    throw new Error("Ferriki sibling source copies differ between each lane root and homepage.")
  }
  return {
    nodeFerrikiPackageSha256: digest(homepagePackageBytes),
    nodeFerrikiPackageLaneRootSha256: digest(laneRootPackageBytes),
    benchmarkReportSha256: digest(homepageReportBytes),
    benchmarkReportLaneRootSha256: digest(laneRootReportBytes),
    identicalLaneRootAndHomepageCopies: true,
  }
}

const lanes = {}
for (const [name, ardoSpecifier] of [
  ["baseline", "^4.2.0"],
  ["candidate", "file:../../../ardo-5.0.0.tgz"],
]) {
  const laneRoot = path.join(output, "lanes", name)
  const homepage = path.join(laneRoot, "homepage")
  const cache = path.join(laneRoot, "cache")
  mkdirSync(laneRoot, { recursive: true })
  cpSync(path.join(ferriki, "homepage"), homepage, { recursive: true })

  const packageJsonFile = path.join(homepage, "package.json")
  const packageJson = JSON.parse(readFileSync(packageJsonFile, "utf8"))
  packageJson.dependencies.ardo = ardoSpecifier
  if (name === "candidate") {
    packageJson.pnpm = {
      ...packageJson.pnpm,
      overrides: {
        ...packageJson.pnpm?.overrides,
        "@ferriki/core": "0.13.0",
        ferromark: "3.4.0",
      },
    }
  }
  writeFileSync(packageJsonFile, `${JSON.stringify(packageJson, null, 2)}\n`)
  writeFileSync(path.join(homepage, "pnpm-lock.yaml"), lockBytes)
  mkdirSync(cache)

  const siblingInputs = copySiblings(laneRoot, homepage)
  const viteAdapter = adaptViteConfig(homepage, laneRoot)
  const verifierAdapter = adaptVerifier(homepage, laneRoot, name)
  const cacheEntries = []
  for (const [relativeAsset, metadata] of Object.entries(manifest.assets)) {
    const sourceFile = path.resolve(ferriki, "assets", "shiki", relativeAsset)
    const sourceRelative = path.relative(path.join(ferriki, "assets", "shiki"), sourceFile)
    if (sourceRelative.startsWith("..") || path.isAbsolute(sourceRelative)) {
      throw new Error(`Asset path escapes the pinned Ferriki source: ${relativeAsset}.`)
    }
    const bytes = readFileSync(sourceFile)
    const sha256 = digest(bytes)
    if (bytes.length !== metadata.size || sha256 !== metadata.sha256) {
      throw new Error(`Ferriki asset verification failed: ${relativeAsset}.`)
    }
    const cacheFile = path.join(cache, sha256)
    if (existsSync(cacheFile)) {
      const existing = readFileSync(cacheFile)
      if (digest(existing) !== sha256)
        throw new Error(`Conflicting cache bytes for ${relativeAsset}.`)
    } else {
      writeFileSync(cacheFile, bytes, { flag: "wx" })
    }
    cacheEntries.push({ path: relativeAsset, size: bytes.length, sha256 })
  }
  cacheEntries.sort((left, right) => left.path.localeCompare(right.path))
  lanes[name] = {
    homepage: path.relative(output, homepage),
    cache: path.relative(output, cache),
    packageJsonSha256: digest(readFileSync(packageJsonFile)),
    seededLockSha256: lockSha256,
    ardoSpecifier,
    adapters: { vite: viteAdapter, buildVerifier: verifierAdapter },
    siblingInputs,
    cacheEntries,
    cacheBytes: cacheEntries.reduce((sum, entry) => sum + entry.size, 0),
  }
}

const receipt = {
  schemaVersion: 2,
  ferriki: {
    commit: expectedFerrikiCommit,
    registryLock: {
      sourceCommit: expectedFerrikiCommit,
      path: "homepage/pnpm-lock.yaml",
      sha256: lockSha256,
      importerArdoSpecifier: "^4.2.0",
      importerArdoVersion: "4.2.0",
    },
    homepageSourcePackageJsonSha256: digest(readFileSync(packageJsonPath)),
    viteConfig: { path: "homepage/vite.config.ts", sha256: sourceViteSha256 },
    buildVerifier: { path: "homepage/scripts/verify-build.mjs", sha256: sourceVerifierSha256 },
    nativeAcceptanceVerifier: {
      path: "homepage/scripts/verify-ardo-acceptance.mjs",
      sha256: sourceNativeAcceptanceSha256,
      checksStyledTokenOutput: true,
    },
    siblingInputs: {
      nodeFerrikiPackage: { path: "node/ferriki/package.json", sha256: packageMetadataSha256 },
      benchmarkReport: {
        path: "docs/benchmarks/shiki-comparison.json",
        sha256: benchmarkReportSha256,
      },
    },
    fixture: {
      path: "homepage/app/routes/evidence/compatibility.mdx",
      sha256: fixtureSha256,
      fencedCodeBlocks: 4,
    },
    assetManifest: {
      path: "assets/shiki/release-manifest.json",
      sha256: manifestSha256,
      assetCount: Object.keys(manifest.assets).length,
      bytes: manifestBytesTotal,
    },
  },
  ardo: {
    sourceCommit: ardoSourceCommit,
    packageVersion: ardoPackage.version,
    tarball: {
      path: path.relative(output, packedTarball),
      size: statSync(packedTarball).size,
      sha256: digest(tarballBytes),
    },
  },
  lanes,
}
writeFileSync(path.join(output, "prepared.json"), `${JSON.stringify(receipt, null, 2)}\n`, {
  flag: "wx",
})
console.log(JSON.stringify(receipt, null, 2))
