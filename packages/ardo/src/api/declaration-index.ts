import type {
  Declaration,
  ModuleExportName,
  Program,
  TSConstructorType,
  TSFunctionType,
  TSTypeReference,
} from "oxc-parser"

import { parseSync, Severity, Visitor } from "oxc-parser"

import type { DeclarationModule, DeclarationRecord } from "./declaration-project"

import { readComment } from "./comments"
import { readDeclarationReferences } from "./declaration-libraries"

type Reporter = (message: string) => void

export function createDeclarationModule(
  file: string,
  source: string,
  report: Reporter
): DeclarationModule {
  const parsed = parseSync(file, source, { lang: "dts", astType: "ts", sourceType: "module" })
  const errors = parsed.errors.filter((error) => error.severity === Severity.Error)
  if (errors.length > 0)
    throw new Error(
      `[ardo] Could not parse ${file}: ${errors.map((error) => error.message).join(" ")}`
    )
  const program = parsed.program
  let generics: ReturnType<typeof indexGenerics> | undefined
  const genericIndex = () => {
    generics ??= indexGenerics(program)
    return generics
  }
  const module: DeclarationModule = {
    file,
    source,
    comments: parsed.comments,
    declarations: new Map(),
    globalDeclarations: new Map(),
    imports: new Map(),
    exports: new Map(),
    stars: [],
    dependencies: new Map(),
    get typeReferences() {
      return genericIndex().references
    },
    get genericScopes() {
      return genericIndex().scopes
    },
    isExternalModule:
      /\.d\.(?:mts|cts)$/u.test(file) ||
      program.body.some(
        (statement) =>
          /^(?:Import|Export)/u.test(statement.type) ||
          [
            "TSImportEqualsDeclaration",
            "TSExportAssignment",
            "TSNamespaceExportDeclaration",
          ].includes(statement.type)
      ),
    references: readDeclarationReferences(
      source,
      parsed.comments,
      program.body.at(0)?.start ?? source.length
    ),
  }
  for (const statement of program.body) indexStatement(statement, module, report)
  indexGlobalAugmentations(program, module, report)
  return module
}

function indexGlobalAugmentations(
  program: Program,
  module: DeclarationModule,
  report: Reporter
): void {
  const blocks = program.body.flatMap((statement) =>
    statement.type === "TSModuleDeclaration" && statement.kind === "global"
      ? statement.body.body
      : []
  )
  if (blocks.length === 0) return
  // Global declarations resolve against merged globals; module helpers stay private.
  const context = globalScope(module)
  for (const statement of blocks) {
    if (isDeclaration(statement))
      addDeclaration(context, statement, {
        start: statement.start,
        declarations: module.globalDeclarations,
      })
    else if (statement.type !== "EmptyStatement")
      report(`Global declaration statement ${statement.type} is not supported.`)
  }
  for (const name of module.globalDeclarations.keys()) context.declarations.delete(name)
}

function globalScope(module: DeclarationModule): DeclarationModule {
  return {
    file: module.file,
    source: module.source,
    comments: module.comments,
    declarations: new Map(module.declarations),
    globalDeclarations: module.globalDeclarations,
    imports: module.imports,
    exports: module.exports,
    stars: module.stars,
    dependencies: module.dependencies,
    get typeReferences() {
      return module.typeReferences
    },
    get genericScopes() {
      return module.genericScopes
    },
    isExternalModule: module.isExternalModule,
    references: module.references,
  }
}

/** Generic substitution is the only consumer of a complete reference/scope walk. */
function indexGenerics(program: Program) {
  const references: TSTypeReference[] = []
  const scopes: Array<TSConstructorType | TSFunctionType> = []
  new Visitor({
    TSTypeReference(node) {
      references.push(node)
    },
    TSFunctionType(node) {
      scopes.push(node)
    },
    TSConstructorType(node) {
      scopes.push(node)
    },
  }).visit(program)
  return { references, scopes }
}

function indexStatement(
  statement: Program["body"][number],
  module: DeclarationModule,
  report: Reporter
): void {
  if (statement.type === "ImportDeclaration") {
    indexImports(statement, module)
    return
  }
  if (statement.type === "ExportNamedDeclaration") {
    indexNamed(statement, module)
    return
  }
  if (statement.type === "ExportDefaultDeclaration") {
    indexDefault(statement, module, report)
    return
  }
  if (statement.type === "ExportAllDeclaration") {
    if (statement.exported == null) module.stars.push(statement.source.value)
    else report(`Namespace export ${exportName(statement.exported)} is not expanded.`)
    return
  }
  if (isDeclaration(statement)) addDeclaration(module, statement, { start: statement.start })
  else if (statement.type !== "EmptyStatement")
    report(`Declaration statement ${statement.type} is not supported.`)
}

function indexImports(
  statement: Extract<Program["body"][number], { type: "ImportDeclaration" }>,
  module: DeclarationModule
): void {
  for (const specifier of statement.specifiers)
    module.imports.set(specifier.local.name, {
      name:
        specifier.type === "ImportSpecifier"
          ? exportName(specifier.imported)
          : specifier.type === "ImportDefaultSpecifier"
            ? "default"
            : "*",
      request: statement.source.value,
    })
}

function indexNamed(
  statement: Extract<Program["body"][number], { type: "ExportNamedDeclaration" }>,
  module: DeclarationModule
): void {
  if (statement.declaration != null) {
    const names = addDeclaration(module, statement.declaration, { start: statement.start })
    for (const name of names) module.exports.set(name, { name })
  }
  for (const specifier of statement.specifiers)
    module.exports.set(exportName(specifier.exported), {
      name: exportName(specifier.local),
      request: statement.source?.value,
    })
}

function indexDefault(
  statement: Extract<Program["body"][number], { type: "ExportDefaultDeclaration" }>,
  module: DeclarationModule,
  report: Reporter
): void {
  const node = statement.declaration
  if (node.type === "Identifier") {
    module.exports.set("default", { name: node.name })
    return
  }
  if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "TSDeclareFunction" ||
    node.type === "TSInterfaceDeclaration"
  ) {
    const names = addDeclaration(module, node, { start: statement.start, fallback: "default" })
    module.exports.set("default", { name: names[0] })
  } else report("This default export is not supported by declaration extraction.")
}

function addDeclaration(
  module: DeclarationModule,
  node: Declaration,
  options: {
    start: number
    fallback?: string
    declarations?: Map<string, DeclarationRecord[]>
  }
): string[] {
  if (node.type === "TSModuleDeclaration" && node.kind === "global") return []
  const declarations = options.declarations ?? module.declarations
  const comment = readComment(module.source, module.comments, options.start)
  const nodes = node.type === "VariableDeclaration" ? node.declarations : [node]
  const names: string[] = []
  for (const declaration of nodes) {
    const name = declaration.id?.type === "Identifier" ? declaration.id.name : options.fallback
    if (name == null) continue
    const records = declarations.get(name) ?? []
    records.push({
      node: declaration,
      comment,
      module,
      variableKind: node.type === "VariableDeclaration" ? node.kind : undefined,
    })
    declarations.set(name, records)
    names.push(name)
  }
  return names
}

function isDeclaration(node: Program["body"][number]): node is Declaration {
  return [
    "VariableDeclaration",
    "TSDeclareFunction",
    "FunctionDeclaration",
    "ClassDeclaration",
    "TSInterfaceDeclaration",
    "TSTypeAliasDeclaration",
    "TSEnumDeclaration",
    "TSModuleDeclaration",
    "TSImportEqualsDeclaration",
  ].includes(node.type)
}

function exportName(node: ModuleExportName): string {
  return node.type === "Literal" ? node.value : node.name
}
