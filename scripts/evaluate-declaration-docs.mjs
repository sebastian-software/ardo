import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { globalArrayNames, typeShape as syntaxShape } from "./declaration-type-shape.mjs"

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
      "Normalized matches": profile.normalizedMemberMatches,
      "Spelling differences normalized": profile.normalizedTypeSpellings.length,
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
  const compilerFiles = execFileSync(
    compiler,
    ["--project", tsconfig, profile.config ? "--listFiles" : "--listFilesOnly"],
    { cwd: root, encoding: "utf8", timeout: 60_000 }
  ).split(/\r?\n/u)
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
  const coreLib = compilerFiles.find((file) => path.basename(file) === "lib.es5.d.ts")
  const libFiles = compilerFiles.filter(
    (file) => coreLib != null && path.dirname(file) === path.dirname(coreLib)
  )
  const extracted = await extractDeclarations([declaration], {
    packageRoot: profile.config ? path.dirname(path.join(root, profile.config)) : undefined,
    libFiles,
  })
  const declarationRoot = profile.config
    ? path.join(directory, "declarations")
    : path.dirname(await fs.realpath(entry))
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
    declarationFiles: extracted.files.length,
    compilerLibFiles: libFiles.map((file) => path.basename(file)),
    typedocDeclarations: references.size,
    typedocOnlyDeclarations: [...references.keys()].filter((name) => !items.has(name)),
    extractorOnlyDeclarations: [...items.keys()].filter((name) => !references.has(name)),
    propertyTablesCompared: 0,
    membersCompared: 0,
    exactMemberMatches: 0,
    normalizedMemberMatches: 0,
    normalizationArrayNames: await comparisonArrays(extracted.files, libFiles),
    normalizedTypeSpellings: [],
    callableTypeSignaturesCompared: 0,
    callableTypeParametersCompared: 0,
    callableTypes: [],
    differences: [],
    additionalTables: [],
    incompleteTables: extracted.items
      .filter((item) => !item.propertiesComplete)
      .map((item) => item.name),
    diagnostics: extracted.diagnostics.map((diagnostic) => ({
      file: path.relative(declarationRoot, diagnostic.file),
      message: diagnostic.message,
    })),
  }
  for (const [name, item] of items) {
    const reference = references.get(name)
    if (reference == null) continue
    const signatures = callSignatures(reference)
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
    if (["type", "interface"].includes(item.kind) && item.signatures.length > 0)
      compareCallableType(result, item, signatures)
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

async function comparisonArrays(files, libraries) {
  const modules = files.filter((file) => !libraries.includes(file))
  const programs = await Promise.all(
    modules.map(
      async (file) =>
        parseSync(file, await fs.readFile(file, "utf8"), { lang: "dts", astType: "ts" }).program
    )
  )
  return globalArrayNames(programs)
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

function callSignatures(reflection, seen = new Set()) {
  const resolved = dereference(reflection)
  if (resolved == null || seen.has(resolved)) return []
  const next = new Set(seen).add(resolved)
  return resolved.signatures ?? typeCallSignatures(resolved.type, next)
}

function typeCallSignatures(type, seen) {
  if (type?.type === "reflection") return callSignatures(type.declaration, seen)
  if (type?.type === "reference") return callSignatures(type.reflection, seen)
  if (type?.type === "query") return typeCallSignatures(type.queryType, seen)
  if (type?.type === "intersection")
    return type.types.flatMap((part) => typeCallSignatures(part, seen))
  return []
}

function compareCallableType(result, item, signatures) {
  result.callableTypes.push({ item: item.name, signatures: item.signatures })
  for (const [index, signature] of item.signatures.entries()) {
    const expected = signatures[index]
    if (expected == null) continue
    result.callableTypeSignaturesCompared++
    const name = `${item.name} (call ${index + 1})`
    const parameters = expected.parameters ?? []
    if (signature.parameters.length !== parameters.length)
      result.differences.push({
        item: name,
        field: "parameter-count",
        extractor: signature.parameters.length,
        typedoc: parameters.length,
      })
    for (const [parameterIndex, parameter] of signature.parameters.entries()) {
      const reference = parameters[parameterIndex]
      if (reference == null) continue
      result.callableTypeParametersCompared++
      const parameterName = `${name}.${parameter.name}`
      for (const [field, value] of Object.entries({
        name: reference.name,
        optional: reference.flags.isOptional,
        rest: reference.flags.isRest,
      }))
        if (parameter[field] !== value)
          result.differences.push({
            item: parameterName,
            field,
            extractor: parameter[field],
            typedoc: value,
          })
      if (reference.type != null)
        compareType(result, parameterName, parameter.type, reference.type.toString())
      compareSummary(result, parameterName, parameter.description, reference.comment)
    }
    if (expected.type != null)
      compareType(result, `${name}.return`, signature.returnType, expected.type.toString())
    compareSummary(
      result,
      `${name}.returns-description`,
      signature.comment.tags.find((tag) => ["returns", "return"].includes(tag.name))?.text ?? "",
      { summary: expected.comment?.getTag("@returns")?.content ?? [] }
    )
  }
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
    const before = result.differences.length
    const spellingsBefore = result.normalizedTypeSpellings.length
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
    if (result.differences.length === before) {
      result.normalizedMemberMatches++
      if (result.normalizedTypeSpellings.length === spellingsBefore) result.exactMemberMatches++
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
  if (actualShape != null && expectedShape != null && actualShape === expectedShape) return
  const options = { normalize: true, arrayNames: result.normalizationArrayNames }
  if (
    actualShape != null &&
    expectedShape != null &&
    typeShape(actual, options) === typeShape(expected, options)
  ) {
    result.normalizedTypeSpellings.push({ item, extractor: actual, typedoc: expected })
  } else
    result.differences.push({
      item,
      field:
        actualShape == null || expectedShape == null ? "uncomparable-type-syntax" : "type-syntax",
      extractor: actual,
      typedoc: expected,
    })
}

// Raw and normalized comparisons share the same parser. Normalization is a
// presentation rule, not general type equivalence; modifiers and calls survive.
function typeShape(value, options) {
  const result = parseSync("compare.d.ts", `type Compared = ${value};`, {
    lang: "dts",
    astType: "ts",
  })
  const declaration = result.program.body[0]
  if (result.errors.length || declaration?.type !== "TSTypeAliasDeclaration") return undefined
  return JSON.stringify(syntaxShape(declaration.typeAnnotation, options))
}
