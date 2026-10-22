import type {
  Declaration,
  Node,
  Program,
  TSGlobalDeclaration,
  TSModuleDeclaration,
} from "oxc-parser"

import type { DeclarationModule } from "./declaration-project"

import { readComment } from "./comments"
import { declarationScope } from "./declaration-scopes"

type Reporter = (message: string) => void
type Statement = Program["body"][number]

export function indexImportEquals(
  node: Extract<Declaration, { type: "TSImportEqualsDeclaration" }>,
  module: DeclarationModule,
  report: Reporter
): void {
  const reference = node.moduleReference
  if (reference.type === "TSExternalModuleReference" && reference.expression.type === "Literal")
    module.imports.set(node.id.name, { name: "*", request: String(reference.expression.value) })
  else {
    const name = qualifiedName(reference)
    if (name != null) module.imports.set(node.id.name, { name })
    else report(`Import alias ${node.id.name} is not supported.`)
  }
}

export function indexNamespace(
  node: TSModuleDeclaration | TSGlobalDeclaration,
  module: DeclarationModule,
  options: {
    report: Reporter
    exported?: boolean
    index: (statement: Statement, module: DeclarationModule) => void
  }
): void {
  const { report, index, exported = false } = options
  if (node.kind === "global" || node.body == null) return
  const qualified = qualifiedName(node.id)
  if (qualified == null) {
    report("String-literal ambient modules are not expanded by declaration extraction.")
    return
  }
  addNamespaceDeclaration(node, module, qualified.split(".")[0])
  const { namespace, parent } = namespaceScope(module, qualified.split("."), {
    exported,
    start: node.start,
  })
  const block = declarationScope(parent, `${namespace.id}:block:${node.start}`)
  block.namespace = namespace
  const implicit = !node.body.body.some(
    (statement) => statement.type === "ExportNamedDeclaration" && statement.declaration == null
  )
  block.implicitExports = implicit
  for (const statement of node.body.body) index(statement, block)
  publishNamespace(block, namespace, implicit)
}

function addNamespaceDeclaration(
  node: TSModuleDeclaration,
  module: DeclarationModule,
  name: string
): void {
  const records = module.declarations.get(name) ?? []
  records.push({ node, module, comment: readComment(module.source, module.comments, node.start) })
  module.declarations.set(name, records)
}

function namespaceScope(
  module: DeclarationModule,
  names: string[],
  options: { exported: boolean; start: number }
): { namespace: DeclarationModule; parent: DeclarationModule } {
  let parent = module
  let namespace = module
  for (const [index, name] of names.entries()) {
    const shared =
      parent.implicitExports !== false || options.exported
        ? parent.namespace?.namespaces.get(name)
        : undefined
    namespace =
      parent.namespaces.get(name) ??
      shared ??
      declarationScope(parent, `${parent.id}:namespace:${name}`)
    parent.namespaces.set(name, namespace)
    if (index > 0) {
      parent.namespace?.namespaces.set(name, namespace)
      parent.namespace?.exports.set(name, { name })
    }
    if (index === names.length - 1) return { namespace, parent }
    // Dotted declarations enter each namespace from this declaration's lexical parent.
    parent = declarationScope(parent, `${namespace.id}:path:${options.start}:${index}`)
    parent.namespace = namespace
  }
  return { namespace, parent }
}

function publishNamespace(
  block: DeclarationModule,
  namespace: DeclarationModule,
  implicit: boolean
): void {
  for (const [name, records] of block.declarations) {
    if (!implicit && block.exports.get(name)?.declaration !== true) continue
    namespace.declarations.set(name, [...(namespace.declarations.get(name) ?? []), ...records])
    namespace.exports.set(name, { name })
  }
  for (const [name, child] of block.namespaces) {
    if (implicit || block.exports.get(name)?.declaration === true)
      namespace.namespaces.set(name, child)
  }
  for (const [name, binding] of block.exports) {
    if (binding.declaration === true && namespace.declarations.has(name)) continue
    namespace.exports.set(name, { ...binding, module: block })
    const imported = block.imports.get(name)
    if (binding.declaration === true && imported != null)
      namespace.imports.set(name, { ...imported, module: block })
  }
}

export function qualifiedName(node: Node): string | undefined {
  if (node.type === "Identifier") return node.name
  if (node.type === "TSQualifiedName") {
    const left = qualifiedName(node.left)
    const right = qualifiedName(node.right)
    if (left != null && right != null) return `${left}.${right}`
  }
  if (node.type === "MemberExpression" && !node.computed && !node.optional) {
    const left = qualifiedName(node.object)
    const right = qualifiedName(node.property)
    if (left != null && right != null) return `${left}.${right}`
  }
  return undefined
}
