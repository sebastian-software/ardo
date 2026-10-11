import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// Opt-in research: differences are observations, not a coverage score or CI gate.
const [output, ...extra] = process.argv.slice(2)
if (extra.length > 0)
  throw new Error("Usage: node scripts/evaluate-declaration-docs.mjs [OUTPUT.json]")
if (output === "--help") {
  console.log(
    "Usage: node scripts/evaluate-declaration-docs.mjs [OUTPUT.json]\n" +
      "Build Ardo first. ARDO_DECLARATION_TSC selects the declaration compiler;\n" +
      "the workspace compiler is the default. No packages are installed."
  )
  process.exit(0)
}

const root = fileURLToPath(new URL("../", import.meta.url))
const require = createRequire(path.join(root, "packages/ardo/package.json"))
const { Application, TSConfigReader, ReflectionKind } = await import(
  pathToFileURL(require.resolve("typedoc"))
)
const { parseSync } = await import(pathToFileURL(require.resolve("oxc-parser")))
const { extractDeclarations } = await import(
  pathToFileURL(path.join(root, "packages/ardo/dist/api/index.js"))
)
const compiler =
  process.env.ARDO_DECLARATION_TSC ?? path.join(root, "node_modules/typescript/bin/tsc")
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
  { name: "ferromark", entry: "packages/ardo/node_modules/ferromark/index.d.mts" },
  { name: "@ferriki/core", entry: "packages/ardo/node_modules/@ferriki/core/index.d.mts" },
]

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-evaluation-"))
try {
  const report = {
    compiler: execFileSync(compiler, ["--version"], { encoding: "utf8", timeout: 15_000 }).trim(),
    typedoc: require("typedoc/package.json").version,
    oxc: JSON.parse(
      await fs.readFile(
        path.join(root, "packages/ardo/node_modules/oxc-parser/package.json"),
        "utf8"
      )
    ).version,
    node: process.version,
    profiles: [],
  }
  for (const [index, profile] of profiles.entries()) {
    console.error(`Comparing ${profile.name}…`)
    report.profiles.push(await evaluate(profile, path.join(temporary, String(index))))
  }
  if (output) await fs.writeFile(path.resolve(output), `${JSON.stringify(report, null, 2)}\n`)
  console.table(
    report.profiles.map((profile) => ({
      API: profile.name,
      Exports: profile.exports,
      "TypeDoc declarations": profile.typedocDeclarations,
      "Property tables compared": profile.propertyTablesCompared,
      "Members compared": profile.membersCompared,
      "Observed differences": profile.differences.length,
      "Additional tables": profile.additionalTables.length,
      Diagnostics: profile.diagnostics.length,
    }))
  )
  if (!output) console.log(JSON.stringify(report, null, 2))
} finally {
  await fs.rm(temporary, { recursive: true, force: true })
}

async function evaluate(profile, directory) {
  await fs.mkdir(directory)
  const entry = path.join(root, profile.entry)
  const tsconfig = path.join(directory, "tsconfig.json")
  const config = profile.config
    ? {
        extends: path.join(root, profile.config),
        compilerOptions: {
          noEmit: false,
          emitDeclarationOnly: true,
          declaration: true,
          declarationMap: false,
          removeComments: false,
          noEmitOnError: true,
          typeRoots: [path.join(root, "node_modules/@types")],
          rootDir: path.join(root, profile.sourceRoot),
          outDir: path.join(directory, "declarations"),
        },
        files: [entry, ...(profile.ambient ?? []).map((file) => path.join(root, file))],
        include: [],
      }
    : {
        compilerOptions: {
          strict: true,
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
          types: [],
        },
        files: [entry],
      }
  await fs.writeFile(tsconfig, JSON.stringify(config))
  if (profile.config)
    execFileSync(compiler, ["--project", tsconfig], {
      cwd: root,
      stdio: "inherit",
      timeout: 60_000,
    })
  const declaration = profile.config ? path.join(directory, "declarations/index.d.ts") : entry
  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints: [entry],
      tsconfig,
      plugin: [],
      excludeInternal: true,
      excludePrivate: true,
      excludeProtected: true,
      logLevel: "Error",
    },
    [new TSConfigReader()]
  )
  const oracle = await app.convert()
  if (oracle == null) throw new Error(`TypeDoc did not convert ${profile.name}.`)
  const extracted = await extractDeclarations([declaration])
  const references = new Map((oracle.children ?? []).map((item) => [item.name, dereference(item)]))
  const items = new Map(extracted.items.map((item) => [item.name, item]))
  const result = {
    name: profile.name,
    typedocCompiler: app.getTypeScriptVersion(),
    entry: profile.entry,
    input: profile.config ? "fresh declaration emit from source" : "published declarations",
    ...(profile.config
      ? {}
      : {
          version: JSON.parse(
            await fs.readFile(path.join(path.dirname(entry), "package.json"), "utf8")
          ).version,
        }),
    exports: items.size,
    typedocDeclarations: references.size,
    typedocOnlyDeclarations: [...references.keys()].filter((name) => !items.has(name)),
    extractorOnlyDeclarations: [...items.keys()].filter((name) => !references.has(name)),
    propertyTablesCompared: 0,
    membersCompared: 0,
    differences: [],
    additionalTables: [],
    incompleteTables: extracted.items
      .filter((item) => !item.propertiesComplete)
      .map((item) => item.name),
    diagnostics: extracted.diagnostics.map((diagnostic) => ({
      file: path.relative(
        profile.config ? path.join(directory, "declarations") : path.dirname(entry),
        diagnostic.file
      ),
      message: diagnostic.message,
    })),
  }
  for (const [name, item] of items) {
    const reference = references.get(name)
    if (reference == null) continue
    const signatures = reference.signatures ?? typeOwner(reference.type)?.signatures ?? []
    compareSummary(
      result,
      name,
      item.comment.description,
      reference.comment ?? signatures[0]?.comment
    )
    if (item.signatures.length !== signatures.length)
      result.differences.push({
        item: name,
        field: "call-signature-count",
        extractor: item.signatures.length,
        typedoc: signatures.length,
      })
    const owner =
      item.kind === "component"
        ? typeOwner(signatures[0]?.parameters?.[0]?.type)
        : reference.children ||
            reference.indexSignatures ||
            reference.kindOf(ReflectionKind.ClassOrInterface)
          ? reference
          : typeOwner(reference.type)
    if (owner == null) {
      if (item.properties.length)
        result.additionalTables.push({
          item: name,
          members: item.properties.map((member) => member.name),
        })
      continue
    }
    compareMembers(result, item, owner)
  }
  return result
}

function dereference(reflection) {
  return reflection?.variant === "reference" ? reflection.getTargetReflectionDeep() : reflection
}

function typeOwner(type, seen = new Set()) {
  if (type == null || seen.has(type)) return undefined
  seen.add(type)
  if (type.type === "reflection") return type.declaration
  if (type.type !== "reference") return undefined
  const reflection = dereference(type.reflection)
  if (
    reflection?.children ||
    reflection?.indexSignatures ||
    reflection?.kindOf(ReflectionKind.ClassOrInterface)
  )
    return reflection
  return typeOwner(reflection?.type, seen)
}

function compareMembers(result, item, owner) {
  result.propertyTablesCompared++
  const expected = new Map(
    (owner.children ?? [])
      .filter((child) =>
        child.kindOf(ReflectionKind.Property | ReflectionKind.Accessor | ReflectionKind.Method)
      )
      .map((child) => [`${child.flags.isStatic}:${child.name}`, child])
  )
  const actual = new Map(
    item.properties
      .filter((property) => !["constructor", "index"].includes(property.kind))
      .map((property) => [`${property.static}:${property.name}`, property])
  )
  const missing = [...expected.keys()]
    .filter((key) => !actual.has(key))
    .map((key) => expected.get(key).name)
  const extra = [...actual.keys()]
    .filter((key) => !expected.has(key))
    .map((key) => actual.get(key).name)
  if (missing.length || extra.length)
    result.differences.push({
      item: item.name,
      field: "member-names",
      typedocOnly: missing,
      extractorOnly: extra,
    })
  for (const [key, property] of actual) {
    const child = expected.get(key)
    if (child == null) continue
    result.membersCompared++
    const name = `${item.name}.${property.name}`
    const flags = {
      optional: child.flags.isOptional,
      readonly:
        child.flags.isReadonly ||
        (child.kindOf(ReflectionKind.Accessor) && child.setSignature == null),
    }
    for (const [field, value] of Object.entries(flags))
      if (property[field] !== value)
        result.differences.push({ item: name, field, extractor: property[field], typedoc: value })
    compareSummary(
      result,
      name,
      property.comment.description,
      child.comment ?? child.getSignature?.comment ?? child.signatures?.[0]?.comment
    )
    if (property.kind === "method") {
      if (property.signatures.length !== (child.signatures?.length ?? 0))
        result.differences.push({
          item: name,
          field: "method-signature-count",
          extractor: property.signatures.length,
          typedoc: child.signatures?.length ?? 0,
        })
    } else {
      const expectedType = (child.type ?? child.getSignature?.type)?.toString()
      if (expectedType != null) compareType(result, name, property.type, expectedType)
    }
  }
}

function compareSummary(result, item, actual, comment) {
  const expected = (comment?.summary ?? []).map((part) => part.text).join("")
  const normalize = (value) => value.replaceAll(/\s+/gu, " ").trim()
  if (normalize(actual) !== normalize(expected))
    result.differences.push({
      item,
      field: "summary",
      extractor: normalize(actual),
      typedoc: normalize(expected),
    })
}

function compareType(result, item, actual, expected) {
  const actualShape = typeShape(actual)
  const expectedShape = typeShape(expected)
  if (actualShape == null || expectedShape == null || actualShape !== expectedShape)
    result.differences.push({
      item,
      field:
        actualShape == null || expectedShape == null ? "uncomparable-type-syntax" : "type-syntax",
      extractor: actual,
      typedoc: expected,
    })
}

// Ignore only trivia and parentheses. Ordering, aliases, modifiers, and rest
// parameters remain visible; unequal syntax does not imply unequal semantics.
function typeShape(value) {
  const result = parseSync("compare.d.ts", `type Compared = ${value};`, {
    lang: "dts",
    astType: "ts",
  })
  const declaration = result.program.body[0]
  if (result.errors.length || declaration?.type !== "TSTypeAliasDeclaration") return undefined
  return JSON.stringify(shape(declaration.typeAnnotation))
}

function shape(value) {
  if (Array.isArray(value)) return value.map(shape)
  if (value == null || typeof value !== "object") return value
  if (value.type === "TSParenthesizedType") return shape(value.typeAnnotation)
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["start", "end", "raw"].includes(key))
      .map(([key, item]) => [key, shape(item)])
  )
}
