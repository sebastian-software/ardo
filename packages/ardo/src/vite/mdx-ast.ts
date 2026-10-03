import type { ModuleBodyNode } from "./mdx-types"

export function getArray(node: ModuleBodyNode, key: string): unknown[] {
  const value = node[key]
  return Array.isArray(value) ? value : []
}

export function getRecord(node: unknown, key?: string): ModuleBodyNode | undefined {
  const value = key == null ? node : isRecord(node) ? node[key] : undefined
  return isRecord(value) ? value : undefined
}

export function getNumber(node: ModuleBodyNode | undefined, key: string): number {
  const value = node?.[key]
  if (typeof value !== "number") {
    throw new TypeError("[ardo] Oxc omitted a source offset for an MDX module declaration.")
  }
  return value
}

export function getString(node: ModuleBodyNode | undefined, key: string): string | undefined {
  const value = node?.[key]
  return typeof value === "string" ? value : undefined
}

export function getIdentifierName(node: ModuleBodyNode | undefined): string | undefined {
  if (node == null) return undefined
  if (typeof node.name === "string") return node.name
  if (typeof node.value === "string") return node.value
  return undefined
}

export function getExportedName(node: ModuleBodyNode | undefined): string | undefined {
  return getIdentifierName(node)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

export function isIdentifier(name: string): boolean {
  return /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u.test(name)
}
