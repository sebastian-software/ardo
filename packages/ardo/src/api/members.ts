import type {
  Class,
  ClassElement,
  MethodDefinition,
  TSIndexSignature,
  TSSignature,
} from "oxc-parser"

import type { DeclarationReader } from "./declaration-project"
import type { TypeContext } from "./source"
import type { ApiProperty } from "./types"

import { isInternal, readComment } from "./comments"
import { readSignature } from "./signatures"
import { annotationOf, formatType } from "./source"

export type Properties = { items: ApiProperty[]; complete: boolean }

export function readMembers(
  members: TSSignature[],
  context: TypeContext,
  reader: DeclarationReader
): Properties {
  return mergeProperties(
    members.map((member) => readMember(member, context, reader)),
    "overloads"
  )
}

function readMember(
  member: TSSignature,
  context: TypeContext,
  reader: DeclarationReader
): Properties {
  const comment = readComment(context.module.source, context.module.comments, member.start)
  if (isInternal(comment)) return { items: [], complete: true }
  if (member.type === "TSIndexSignature")
    return { items: [readIndexSignature(member, context, comment)], complete: true }
  if (member.type !== "TSPropertySignature" && member.type !== "TSMethodSignature") {
    reader.report(
      context.module,
      `Member ${member.type} is preserved in the declaration but not expanded.`
    )
    return { items: [], complete: false }
  }
  const name =
    member.key.type === "Literal" ? String(member.key.value) : formatType(member.key, context)
  const signatures =
    member.type === "TSMethodSignature" ? [readSignature(member, context, { name, comment })] : []
  const annotation = annotationOf(member)
  const type =
    signatures.at(0)?.text ??
    (annotation == null ? "/* type not declared */" : formatType(annotation, context))
  return {
    items: [
      {
        name,
        kind: signatures.length === 0 ? "property" : "method",
        type,
        optional: member.optional,
        readonly: member.readonly,
        static: false,
        comment,
        signatures,
      },
    ],
    complete: true,
  }
}

export function readClassMembers(node: Class, context: TypeContext): Properties {
  const items: ApiProperty[] = []
  const accessors = new Map<string, number>()
  for (const member of node.body.body) {
    if (member.type === "StaticBlock") continue
    if (member.type === "TSIndexSignature") {
      const comment = readComment(context.module.source, context.module.comments, member.start)
      if (!isInternal(comment)) items.push(readIndexSignature(member, context, comment))
      continue
    }
    const property = readClassMember(member, context)
    if (property != null)
      appendClassMember(items, property, {
        accessors,
        accessor: isAccessor(member),
      })
  }
  return mergeProperties([{ items, complete: true }], "overloads")
}

function readIndexSignature(
  member: TSIndexSignature,
  context: TypeContext,
  comment: ApiProperty["comment"]
): ApiProperty {
  const annotation = annotationOf(member)
  return {
    name: `[${member.parameters.map((parameter) => formatType(parameter, context)).join(", ")}]`,
    kind: "index",
    type: annotation == null ? "/* type not declared */" : formatType(annotation, context),
    optional: false,
    readonly: member.readonly,
    static: member.static,
    comment,
    signatures: [],
  }
}

function appendClassMember(
  items: ApiProperty[],
  property: ApiProperty,
  options: { accessors: Map<string, number>; accessor: boolean }
): void {
  const key = `${property.static}:${property.name}`
  const index = options.accessor ? options.accessors.get(key) : undefined
  if (index == null) {
    if (options.accessor) options.accessors.set(key, items.length)
    items.push(property)
    return
  }
  const previous = items[index]
  const getter = previous.readonly ? previous : property
  const setter = previous.readonly ? property : previous
  items[index] = {
    ...getter,
    readonly: previous.readonly && property.readonly,
    comment:
      getter.comment.description !== "" || getter.comment.tags.length > 0
        ? getter.comment
        : setter.comment,
  }
}

function readClassMember(
  member: Exclude<ClassElement, { type: "StaticBlock" | "TSIndexSignature" }>,
  context: TypeContext
): ApiProperty | undefined {
  const comment = readComment(context.module.source, context.module.comments, member.start)
  if (
    isInternal(comment) ||
    member.accessibility === "private" ||
    member.accessibility === "protected" ||
    member.key.type === "PrivateIdentifier"
  )
    return undefined
  const name = formatType(member.key, context)
  if (isMethod(member)) return readClassMethod(member, context, { name, comment })
  const annotation = annotationOf(member)
  return {
    name,
    kind: "property",
    type: annotation == null ? "/* type not declared */" : formatType(annotation, context),
    optional: member.optional ?? false,
    readonly: member.readonly ?? false,
    static: member.static,
    comment,
    signatures: [],
  }
}

function readClassMethod(
  member: MethodDefinition,
  context: TypeContext,
  metadata: { name: string; comment: ApiProperty["comment"] }
): ApiProperty {
  const signature = readSignature(member.value, context, metadata)
  const accessor = member.kind === "get" || member.kind === "set"
  const type =
    member.kind === "get"
      ? signature.returnType
      : member.kind === "set"
        ? (signature.parameters.at(0)?.type ?? "/* type not declared */")
        : signature.text
  return {
    ...metadata,
    kind: member.kind === "constructor" ? "constructor" : accessor ? "property" : "method",
    type,
    optional: member.optional ?? false,
    readonly: member.kind === "get",
    static: member.static,
    signatures: accessor ? [] : [signature],
  }
}

function isMethod(member: ClassElement): member is MethodDefinition {
  return member.type === "MethodDefinition" || member.type === "TSAbstractMethodDefinition"
}

function isAccessor(member: ClassElement): boolean {
  return isMethod(member) && (member.kind === "get" || member.kind === "set")
}

export function mergeProperties(
  groups: Properties[],
  mode: "intersection" | "overloads" | "override" = "override"
): Properties {
  const merged = new Map<string, ApiProperty>()
  for (const group of groups) {
    for (const property of group.items) {
      const key = `${property.static}:${property.name}`
      merged.set(key, mergeProperty(merged.get(key), property, mode))
    }
  }
  return { items: [...merged.values()], complete: groups.every((group) => group.complete) }
}

function mergeProperty(
  previous: ApiProperty | undefined,
  property: ApiProperty,
  mode: "intersection" | "overloads" | "override"
): ApiProperty {
  if (previous == null) return property
  if (mode === "overloads" && previous.kind === "method" && property.kind === "method")
    return { ...property, signatures: [...previous.signatures, ...property.signatures] }
  if (mode === "intersection")
    return {
      ...property,
      optional: previous.optional && property.optional,
      type:
        previous.type === property.type ? property.type : `(${previous.type}) & (${property.type})`,
    }
  return property
}
