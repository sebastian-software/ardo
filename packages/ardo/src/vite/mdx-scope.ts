import type { JsxResult } from "ferromark"

import { parseSync, Severity } from "oxc-parser"

import type { EsmBlock, ModuleBodyNode, ModuleNames, ModuleScope } from "./mdx-types"

import { getArray, getRecord, isRecord } from "./mdx-ast"

export function readModuleScope(input: {
  body: JsxResult["body"]
  entries: JsxResult["esm"]
  filename: string
  source: string
}): ModuleScope {
  const sourceBytes = Buffer.from(input.source, "utf8")
  const blocks = input.entries.map((entry) => readEsmBlock(entry, sourceBytes, input.filename))
  const scope: ModuleScope = {
    bindings: new Set<string>(),
    blocks,
    exportedNames: new Set<string>(),
    identifiers: new Set<string>(),
  }

  for (const block of blocks) {
    for (const node of block.body) {
      collectIdentifiers(node, scope.identifiers)
      collectTopLevelBindings(node, scope.bindings)
      collectTopLevelExports(node, scope.exportedNames)
    }
  }

  collectBodyIdentifiers(input.body, input.filename, scope.identifiers)

  return scope
}

export function allocateModuleNames(scope: ModuleScope): ModuleNames {
  const used = new Set(scope.identifiers)
  const allocate = (base: string): string => {
    let name = base
    let suffix = 1
    while (used.has(name)) {
      name = `${base}${suffix}`
      suffix += 1
    }
    used.add(name)
    return name
  }

  return {
    authoredLayout: allocate("_ardoAuthoredLayout"),
    components: allocate("_ardoComponents"),
    content: allocate("_ardoContent"),
    frontmatter: allocate("_ardoFrontmatter"),
    mermaid: allocate("_ArdoMermaid"),
    pageDataProvider: allocate("_ArdoPageDataProvider"),
    route: allocate("_ardoRoute"),
    toc: allocate("_ardoToc"),
    useComponents: allocate("_useMDXComponents"),
  }
}

function readEsmBlock(
  entry: JsxResult["esm"][number],
  sourceBytes: Buffer,
  filename: string
): EsmBlock {
  const exactSource = sourceBytes.subarray(entry.start, entry.end).toString("utf8")
  if (exactSource !== entry.value) {
    throw new Error(
      `[ardo] Ferromark returned a non-root ESM span for ${filename}; exact source mapping is unavailable.`
    )
  }

  const parsed = parseSync(filename, entry.value, {
    astType: "ts",
    lang: "tsx",
    sourceType: "module",
  })
  const errors = parsed.errors.filter((error) => error.severity === Severity.Error)
  if (errors.length > 0) {
    throw new Error(
      `[ardo] Could not parse an MDX JavaScript block in ${filename}: ${errors.map((error) => error.message).join(" ")}`
    )
  }

  const body: ModuleBodyNode[] = []
  for (const node of parsed.program.body) {
    const value: unknown = node
    if (isRecord(value)) body.push(value)
  }

  return {
    body,
    end: entry.end,
    start: entry.start,
    value: entry.value,
  }
}

function collectIdentifiers(value: unknown, output: Set<string>, seen = new WeakSet()): void {
  if (Array.isArray(value)) {
    for (const item of value) collectIdentifiers(item, output, seen)
    return
  }
  if (!isRecord(value) || seen.has(value)) return
  seen.add(value)

  if (
    (value.type === "Identifier" || value.type === "JSXIdentifier") &&
    typeof value.name === "string"
  ) {
    output.add(value.name)
  }
  for (const child of Object.values(value)) collectIdentifiers(child, output, seen)
}

function collectBodyIdentifiers(body: string, filename: string, output: Set<string>): void {
  const parsed = parseSync(filename, body, {
    astType: "ts",
    lang: "tsx",
    sourceType: "module",
  })
  const errors = parsed.errors.filter((error) => error.severity === Severity.Error)
  if (errors.length > 0) {
    throw new Error(
      `[ardo] Could not parse generated JSX for ${filename}: ${errors.map((error) => error.message).join(" ")}`
    )
  }
  for (const node of parsed.program.body) {
    const value: unknown = node
    collectIdentifiers(value, output)
  }
}

function collectTopLevelBindings(node: ModuleBodyNode, output: Set<string>): void {
  if (node.type === "ImportDeclaration") {
    addImportBindings(node, output)
    return
  }
  if (node.type === "ExportDefaultDeclaration") {
    addDefaultDeclarationBinding(node, output)
    return
  }

  const declaration = node.type === "ExportNamedDeclaration" ? getRecord(node, "declaration") : node
  if (declaration != null) collectDeclarationBindings(declaration, output)
}

function addImportBindings(node: ModuleBodyNode, output: Set<string>): void {
  for (const specifier of getArray(node, "specifiers")) {
    addIdentifierName(getRecord(specifier, "local"), output)
  }
}

function addDefaultDeclarationBinding(node: ModuleBodyNode, output: Set<string>): void {
  const declaration = getRecord(node, "declaration")
  if (declaration?.type !== "FunctionDeclaration" && declaration?.type !== "ClassDeclaration")
    return
  addIdentifierName(getRecord(declaration, "id"), output)
}

function collectDeclarationBindings(declaration: ModuleBodyNode, output: Set<string>): void {
  if (declaration.type === "VariableDeclaration") {
    collectVariableBindings(declaration, output)
    return
  }

  if (
    declaration.type === "FunctionDeclaration" ||
    declaration.type === "ClassDeclaration" ||
    declaration.type === "TSInterfaceDeclaration" ||
    declaration.type === "TSTypeAliasDeclaration" ||
    declaration.type === "TSEnumDeclaration"
  ) {
    addIdentifierName(getRecord(declaration, "id"), output)
  }
}

function collectVariableBindings(node: ModuleBodyNode, output: Set<string>): void {
  for (const declarator of getArray(node, "declarations")) {
    collectPatternNames(getRecord(declarator, "id"), output)
  }
}

function collectTopLevelExports(node: ModuleBodyNode, output: Set<string>): void {
  if (node.type === "ExportDefaultDeclaration") {
    output.add("default")
    return
  }
  if (node.type === "ExportAllDeclaration") {
    const exported = getRecord(node, "exported")
    if (exported != null) addIdentifierName(exported, output)
    return
  }
  if (node.type !== "ExportNamedDeclaration" || String(node.exportKind) === "type") return

  const declaration = getRecord(node, "declaration")
  if (declaration != null) collectExportedDeclarationNames(declaration, output)
  collectExportSpecifierNames(node, output)
}

function collectExportedDeclarationNames(node: ModuleBodyNode, output: Set<string>): void {
  const names = new Set<string>()
  collectDeclarationBindings(node, names)
  for (const name of names) output.add(name)
}

function collectExportSpecifierNames(node: ModuleBodyNode, output: Set<string>): void {
  for (const specifier of getArray(node, "specifiers")) {
    const exported = getRecord(specifier, "exported")
    if (exported != null) addIdentifierName(exported, output)
  }
}

function collectPatternNames(pattern: ModuleBodyNode | undefined, output: Set<string>): void {
  if (pattern == null) return
  switch (pattern.type) {
    case "Identifier":
      addIdentifierName(pattern, output)
      return
    case "RestElement":
      collectPatternNames(getRecord(pattern, "argument"), output)
      return
    case "AssignmentPattern":
      collectPatternNames(getRecord(pattern, "left"), output)
      return
    case "ArrayPattern":
      collectArrayPatternNames(pattern, output)
      return
    case "ObjectPattern":
      collectObjectPatternNames(pattern, output)
      break
    default:
      break
  }
}

function collectArrayPatternNames(pattern: ModuleBodyNode, output: Set<string>): void {
  for (const element of getArray(pattern, "elements")) {
    collectPatternNames(getRecord(element), output)
  }
}

function collectObjectPatternNames(pattern: ModuleBodyNode, output: Set<string>): void {
  for (const property of getArray(pattern, "properties")) {
    const argument = getRecord(property, "argument")
    const value = getRecord(property, "value")
    collectPatternNames(argument ?? value, output)
  }
}

function addIdentifierName(node: ModuleBodyNode | undefined, output: Set<string>): void {
  if (node?.type === "Identifier" && typeof node.name === "string") output.add(node.name)
}
