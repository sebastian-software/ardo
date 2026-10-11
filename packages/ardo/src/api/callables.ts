import type { TSSignature } from "oxc-parser"

import type {
  DeclarationReader,
  DeclarationRecord,
  ResolvedDeclaration,
} from "./declaration-project"
import type { Callable } from "./signatures"
import type { TypeContext, TypeValue } from "./source"
import type { Reference } from "./type-bindings"
import type { ApiComment } from "./types"

import { isInternal, readComment } from "./comments"
import { annotationOf, formatType } from "./source"
import { ArgumentBindings, baseReferences } from "./type-bindings"

type ResolvedCallable = { node: Callable; context: TypeContext; comment: ApiComment }
type Resolution = { comment: ApiComment; seen: Set<string> }

export async function resolveCallables(
  record: DeclarationRecord,
  context: TypeContext,
  options: { reader: DeclarationReader; seen?: Set<string> }
): Promise<ResolvedCallable[]> {
  return new DeclarationCallables(options.reader).declaration(
    record,
    context,
    options.seen ?? new Set()
  )
}

/** Resolve explicit call signatures without synthesizing union or conditional calls. */
class DeclarationCallables {
  private readonly bindings = new ArgumentBindings()
  constructor(private readonly reader: DeclarationReader) {}

  async declaration(
    record: DeclarationRecord,
    context: TypeContext,
    seen: Set<string>
  ): Promise<ResolvedCallable[]> {
    const { node, comment } = record
    const local = { ...context, module: record.module }
    const state = { comment, seen }
    if (node.type === "TSDeclareFunction" || node.type === "FunctionDeclaration")
      return [{ node, context: local, comment }]
    if (node.type === "TSTypeAliasDeclaration")
      return this.of({ ...local, node: node.typeAnnotation }, state)
    if (node.type === "VariableDeclarator") {
      const type = annotationOf(node.id)
      return type == null ? [] : this.of({ ...local, node: type }, state)
    }
    if (node.type !== "TSInterfaceDeclaration") return []
    const result: ResolvedCallable[] = []
    for (const base of baseReferences(node, local))
      result.push(...(await this.reference(base, local, state)))
    result.push(...this.members(node.body.body, local, comment))
    return result
  }

  private async of(value: TypeValue, state: Resolution): Promise<ResolvedCallable[]> {
    const { node } = value
    if (node.type === "TSFunctionType") return [{ node, context: value, comment: state.comment }]
    if (node.type === "TSParenthesizedType")
      return this.of({ ...value, node: node.typeAnnotation }, state)
    if (node.type === "TSTypeLiteral") return this.members(node.members, value, state.comment)
    if (node.type === "TSIntersectionType") {
      const result: ResolvedCallable[] = []
      for (const type of node.types)
        result.push(...(await this.of({ ...value, node: type }, state)))
      return result
    }
    if (node.type === "TSTypeQuery") return this.query(value, state)
    if (node.type !== "TSTypeReference") return []
    const name =
      node.typeName.type === "Identifier" ? node.typeName.name : formatType(node.typeName, value)
    const bound = value.bindings.get(name)
    if (bound != null)
      return this.of(bound, { ...state, seen: this.bindings.scope(bound, state.seen) })
    return this.reference({ name, args: node.typeArguments?.params ?? [] }, value, state)
  }

  private async query(value: TypeValue, state: Resolution): Promise<ResolvedCallable[]> {
    if (value.node.type !== "TSTypeQuery" || value.node.typeArguments != null) return []
    const resolved = await this.reader.resolve(value.module, formatType(value.node.exprName, value))
    return resolved == null
      ? []
      : this.target(
          resolved,
          { module: resolved.module, bindings: new Map() },
          {
            ...state,
            key: `${resolved.module.file}:value:${resolved.name}`,
          }
        )
  }

  private members(
    members: TSSignature[],
    context: TypeContext,
    comment: ApiComment
  ): ResolvedCallable[] {
    return members
      .filter((member) => member.type === "TSCallSignatureDeclaration")
      .map((node) => ({
        node,
        context,
        comment: readComment(context.module.source, context.module.comments, node.start),
      }))
      .filter((callable) => !isInternal(callable.comment))
      .map((callable) => ({ ...callable, comment: inheritComment(callable.comment, comment) }))
  }

  private async reference(
    reference: Reference,
    context: TypeContext,
    state: Resolution
  ): Promise<ResolvedCallable[]> {
    const local = this.reader.isLibrary(context.module)
      ? undefined
      : await this.reader.resolve(context.module, reference.name)
    const resolved =
      local ??
      (context.module.imports.has(reference.name)
        ? undefined
        : this.reader.globalType(reference.name))
    if (resolved == null) return []
    const key = `${resolved.module.file}:type:${resolved.name}`
    return this.target(
      resolved,
      {
        module: resolved.module,
        bindings: this.bindings.bind(resolved, { args: reference.args, context }, state.seen),
      },
      { ...state, key }
    )
  }

  private async target(
    resolved: ResolvedDeclaration,
    context: TypeContext,
    state: { key: string } & Resolution
  ): Promise<ResolvedCallable[]> {
    if (state.seen.has(state.key)) return []
    const seen = new Set(state.seen).add(state.key)
    const result: ResolvedCallable[] = []
    for (const record of resolved.records)
      result.push(...(await this.declaration(record, context, seen)))
    return result.map((callable) => ({
      ...callable,
      comment: inheritComment(state.comment, callable.comment),
    }))
  }
}

function inheritComment(preferred: ApiComment, fallback: ApiComment): ApiComment {
  const returns = preferred.tags.some((tag) => ["return", "returns"].includes(tag.name))
  return {
    description: preferred.description || fallback.description,
    tags: [
      ...preferred.tags,
      ...fallback.tags.filter(
        (tag) =>
          (!returns || !["return", "returns"].includes(tag.name)) &&
          !preferred.tags.some((item) => item.name === tag.name && item.text === tag.text)
      ),
    ],
  }
}
