import type MagicString from "magic-string"

import type { AuthoredLayout, EsmBlock, ModuleBodyNode, ModuleNames } from "./mdx-types"

import {
  getArray,
  getExportedName,
  getIdentifierName,
  getNumber,
  getRecord,
  getString,
} from "./mdx-ast"

type LayoutContext = { magic: MagicString; names: ModuleNames; sourceBytes: Buffer }

export function preserveEsmAndFindLayout(input: {
  blocks: EsmBlock[]
  magic: MagicString
  names: ModuleNames
  sourceBytes: Buffer
}): AuthoredLayout {
  let layout: AuthoredLayout = {}
  for (const block of input.blocks) {
    for (const node of block.body) {
      layout = preserveModuleNode({ block, context: input, layout, node })
    }
  }
  return layout
}

export function removeMarkdownOutsideEsm(input: {
  blocks: EsmBlock[]
  magic: MagicString
  source: string
  sourceBytes: Buffer
}): void {
  if (input.blocks.length === 0) {
    input.magic.remove(0, input.source.length)
    return
  }

  let cursor = 0
  for (const block of input.blocks) {
    const start = byteOffsetToCodeUnit(input.sourceBytes, block.start)
    const end = byteOffsetToCodeUnit(input.sourceBytes, block.end)
    if (start < cursor || end < start || end > input.source.length) {
      throw new Error("[ardo] Ferromark returned overlapping ESM source spans.")
    }
    if (start > cursor) input.magic.remove(cursor, start)
    cursor = end
  }
  if (cursor < input.source.length) input.magic.remove(cursor, input.source.length)
  for (const block of input.blocks.slice(0, -1)) {
    input.magic.appendLeft(byteOffsetToCodeUnit(input.sourceBytes, block.end), "\n")
  }
}

function preserveModuleNode(input: {
  block: EsmBlock
  context: LayoutContext
  layout: AuthoredLayout
  node: ModuleBodyNode
}): AuthoredLayout {
  switch (input.node.type) {
    case "ExportDefaultDeclaration":
      return preserveDefaultDeclaration(input)
    case "ExportNamedDeclaration":
      return preserveNamedDefaultExport(input)
    case "ExportAllDeclaration":
      return preserveExportAllDefault(input)
    default:
      return input.layout
  }
}

function preserveDefaultDeclaration(input: {
  block: EsmBlock
  context: LayoutContext
  layout: AuthoredLayout
  node: ModuleBodyNode
}): AuthoredLayout {
  ensureNoDefaultLayout(input.layout)
  const declaration = getRecord(input.node, "declaration")
  if (declaration == null) return input.layout

  const nodeStart =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(input.node, "start")
  const declarationStart =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(declaration, "start")
  const localName = getIdentifierName(getRecord(declaration, "id"))
  if (
    (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") &&
    localName != null
  ) {
    input.context.magic.remove(nodeStart, declarationStart)
    return { localBinding: localName }
  }

  input.context.magic.overwrite(
    nodeStart,
    declarationStart,
    `const ${input.context.names.authoredLayout} = `
  )
  return { expression: input.context.names.authoredLayout }
}

function preserveNamedDefaultExport(input: {
  block: EsmBlock
  context: LayoutContext
  layout: AuthoredLayout
  node: ModuleBodyNode
}): AuthoredLayout {
  const specifiers = getArray(input.node, "specifiers")
  const defaultIndex = specifiers.findIndex(
    (specifier) => getExportedName(getRecord(specifier, "exported")) === "default"
  )
  if (defaultIndex === -1) return input.layout

  ensureNoDefaultLayout(input.layout)
  const defaultSpecifier = getRecord(specifiers[defaultIndex])
  if (defaultSpecifier == null) return input.layout
  const source = getRecord(input.node, "source")
  const statementStart =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(input.node, "start")
  const statementEnd =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(input.node, "end")
  const specifierStart = getNumber(defaultSpecifier, "start")
  const specifierEnd = getNumber(defaultSpecifier, "end")

  if (source != null) {
    return preserveExternalDefault({
      ...input,
      defaultIndex,
      specifierEnd,
      specifierStart,
      specifiers,
      statementEnd,
      statementStart,
    })
  }

  return preserveLocalDefault({
    ...input,
    defaultIndex,
    specifierEnd,
    specifierStart,
    specifiers,
    statementEnd,
    statementStart,
  })
}

function preserveLocalDefault(input: {
  block: EsmBlock
  context: LayoutContext
  defaultIndex: number
  node: ModuleBodyNode
  specifierEnd: number
  specifierStart: number
  specifiers: unknown[]
  statementEnd: number
  statementStart: number
}): AuthoredLayout {
  const specifier = getRecord(input.specifiers[input.defaultIndex])
  const localName = getIdentifierName(getRecord(specifier, "local"))
  if (localName == null) {
    throw new Error("[ardo] An MDX default layout export must resolve to a local binding.")
  }
  removeExportSpecifier(input)
  return { expression: localName }
}

function preserveExternalDefault(input: {
  block: EsmBlock
  context: LayoutContext
  defaultIndex: number
  node: ModuleBodyNode
  specifierEnd: number
  specifierStart: number
  specifiers: unknown[]
  statementEnd: number
  statementStart: number
}): AuthoredLayout {
  const sourceName = getString(getRecord(input.node, "source"), "value")
  if (sourceName == null) {
    throw new Error("[ardo] Could not resolve the source of an MDX default layout export.")
  }
  const specifier = getRecord(input.specifiers[input.defaultIndex])
  const importedName = getExportedName(getRecord(specifier, "local"))
  if (importedName == null) {
    throw new Error("[ardo] Could not resolve the name of an MDX default layout export.")
  }
  removeExportSpecifier(input)
  const importStatement =
    importedName === "default"
      ? `import ${input.context.names.authoredLayout} from ${JSON.stringify(sourceName)};`
      : `import { ${importedName} as ${input.context.names.authoredLayout} } from ${JSON.stringify(sourceName)};`
  return { importStatement }
}

function preserveExportAllDefault(input: {
  block: EsmBlock
  context: LayoutContext
  layout: AuthoredLayout
  node: ModuleBodyNode
}): AuthoredLayout {
  if (getExportedName(getRecord(input.node, "exported")) !== "default") return input.layout
  ensureNoDefaultLayout(input.layout)
  const sourceName = getString(getRecord(input.node, "source"), "value")
  if (sourceName == null) {
    throw new Error("[ardo] Could not resolve the source of an MDX default layout export.")
  }
  const start =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(input.node, "start")
  const end =
    byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start) +
    getNumber(input.node, "end")
  input.context.magic.remove(start, end)
  return {
    importStatement: `import * as ${input.context.names.authoredLayout} from ${JSON.stringify(sourceName)};`,
  }
}

function removeExportSpecifier(input: {
  block: EsmBlock
  context: { magic: MagicString; names: ModuleNames; sourceBytes: Buffer }
  defaultIndex: number
  specifierEnd: number
  specifierStart: number
  specifiers: unknown[]
  statementEnd: number
  statementStart: number
}): void {
  if (input.specifiers.length === 1) {
    input.context.magic.remove(input.statementStart, input.statementEnd)
    return
  }

  const offset = byteOffsetToCodeUnit(input.context.sourceBytes, input.block.start)
  const start =
    input.defaultIndex < input.specifiers.length - 1
      ? offset + input.specifierStart
      : offset + getNumber(getRecord(input.specifiers[input.defaultIndex - 1]), "end")
  const end =
    input.defaultIndex < input.specifiers.length - 1
      ? offset + getNumber(getRecord(input.specifiers[input.defaultIndex + 1]), "start")
      : offset + input.specifierEnd
  input.context.magic.remove(start, end)
}

function ensureNoDefaultLayout(layout: AuthoredLayout): void {
  if (layout.expression != null || layout.localBinding != null || layout.importStatement != null) {
    throw new Error("[ardo] An MDX module can declare only one default layout export.")
  }
}

function byteOffsetToCodeUnit(source: Buffer, byteOffset: number): number {
  if (byteOffset < 0 || byteOffset > source.length) {
    throw new Error("[ardo] Ferromark returned an invalid UTF-8 source offset.")
  }
  return source.subarray(0, byteOffset).toString("utf8").length
}
