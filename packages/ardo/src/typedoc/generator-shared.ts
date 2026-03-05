import { type DeclarationReflection, type ProjectReflection, ReflectionKind } from "typedoc"

export interface GroupedReflections {
  componentItems: DeclarationReflection[]
  functionsByFile: Map<string, DeclarationReflection[]>
  standaloneItems: DeclarationReflection[]
  typesByFile: Map<string, DeclarationReflection[]>
}

export interface ReflectionNavigation {
  next: DeclarationReflection | null
  prev: DeclarationReflection | null
}

export interface ComponentProp {
  description: string
  name: string
  optional: boolean
  type: string
}

export interface CommentPart {
  kind: string
  text: string
}

export function groupProjectChildren(
  project: ProjectReflection,
  isComponentName: (name: string) => boolean
): GroupedReflections {
  const grouped: GroupedReflections = {
    componentItems: [],
    functionsByFile: new Map<string, DeclarationReflection[]>(),
    standaloneItems: [],
    typesByFile: new Map<string, DeclarationReflection[]>(),
  }

  const children = project.children ?? []
  for (const child of children) {
    if (appendFunctionReflection(grouped, child, isComponentName)) {
      continue
    }
    if (appendTypeAliasReflection(grouped, child)) {
      continue
    }
    grouped.standaloneItems.push(child)
  }

  return grouped
}

function appendFunctionReflection(
  grouped: GroupedReflections,
  child: DeclarationReflection,
  isComponentName: (name: string) => boolean
): boolean {
  const sourceFile = child.sources?.[0]?.fileName
  if (child.kind !== ReflectionKind.Function || sourceFile == null) {
    return false
  }

  if (isComponentName(child.name)) {
    grouped.componentItems.push(child)
    return true
  }

  appendToMapList(grouped.functionsByFile, sourceFile, child)
  return true
}

function appendTypeAliasReflection(
  grouped: GroupedReflections,
  child: DeclarationReflection
): boolean {
  const sourceFile = child.sources?.[0]?.fileName
  if (child.kind !== ReflectionKind.TypeAlias || sourceFile == null) {
    return false
  }

  appendToMapList(grouped.typesByFile, sourceFile, child)
  return true
}

export function appendToMapList<T>(map: Map<string, T[]>, key: string, item: T): void {
  const items = map.get(key) ?? []
  items.push(item)
  map.set(key, items)
}

export function sortReflectionsByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name))
}

export function getModuleNameFromPath(
  filePath: string,
  packageNameCache: Map<string, string | undefined>
): string {
  const parts = filePath.split("/")
  const filePart = parts.pop() ?? filePath
  const basename = filePart.replace(/\.(?:ts|tsx|js|jsx)$/u, "")
  const parent = parts.pop()

  if (parent != null && parent !== "src") {
    return `${parent}/${basename}`
  }

  if (basename === "index") {
    for (const packageName of packageNameCache.values()) {
      if (packageName != null && packageName.length > 0) {
        return packageName
      }
    }
  }

  return basename
}

export function renderComment(parts: CommentPart[]): string {
  return parts.map((part) => part.text).join("")
}

export function renderCommentShort(parts: CommentPart[]): string {
  const text = renderComment(parts)
  const firstSentence = text.split(/[!.?]\s/u)[0]
  if (firstSentence.length < text.length) {
    return `${firstSentence}.`
  }
  return text
}

export function getSlug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^\da-z]+/gu, "-")
    .replaceAll(/^-|-$/gu, "")
}

export function buildLink(basePath: string, category: string, slug: string): string {
  if (slug === "index") {
    return `${basePath}/${category}`
  }
  return `${basePath}/${category}/${slug}`
}

export function getSourceUrl(
  sourceBaseUrl: string | undefined,
  fileName: string,
  line: number
): null | string {
  if (sourceBaseUrl == null || sourceBaseUrl.length === 0) {
    return null
  }
  const baseUrl = sourceBaseUrl.replace(/\/$/u, "")
  return `${baseUrl}/${fileName}#L${line}`
}

export function getKindName(kind: ReflectionKind): string {
  const kindNames: Partial<Record<ReflectionKind, string>> = {
    [ReflectionKind.Project]: "Project",
    [ReflectionKind.Module]: "Module",
    [ReflectionKind.Namespace]: "Namespace",
    [ReflectionKind.Enum]: "Enum",
    [ReflectionKind.EnumMember]: "Enum Member",
    [ReflectionKind.Variable]: "Variable",
    [ReflectionKind.Function]: "Function",
    [ReflectionKind.Class]: "Class",
    [ReflectionKind.Interface]: "Interface",
    [ReflectionKind.Constructor]: "Constructor",
    [ReflectionKind.Property]: "Property",
    [ReflectionKind.Method]: "Method",
    [ReflectionKind.TypeAlias]: "Type",
  }
  return kindNames[kind] ?? "Unknown"
}

export function getGroupUrlPrefix(kind: ReflectionKind): string {
  const prefixes: Partial<Record<ReflectionKind, string>> = {
    [ReflectionKind.Enum]: "enums",
    [ReflectionKind.Variable]: "variables",
    [ReflectionKind.Class]: "classes",
    [ReflectionKind.Interface]: "interfaces",
    [ReflectionKind.Namespace]: "namespaces",
    [ReflectionKind.Module]: "modules",
  }
  return prefixes[kind] ?? "other"
}

export function getKindGroupName(kind: ReflectionKind, name: string): string {
  if (kind === ReflectionKind.Function) {
    if (name.startsWith("use")) {
      return "React Hooks"
    }
    if (isReactComponent(name)) {
      return "React Components"
    }
    return "Functions"
  }

  switch (kind) {
    case ReflectionKind.Interface:
      return "Interfaces"
    case ReflectionKind.TypeAlias:
      return "Types"
    case ReflectionKind.Class:
      return "Classes"
    case ReflectionKind.Variable:
      return "Variables"
    case ReflectionKind.Enum:
      return "Enums"
    default:
      return "Other"
  }
}

export function isReactComponent(name: string): boolean {
  const first = name.slice(0, 1)
  if (first.length === 0 || first !== first.toUpperCase()) {
    return false
  }
  if (name.includes("_") || name.startsWith("use")) {
    return false
  }
  if (name.endsWith("Props") || name.endsWith("Options") || name.endsWith("Config")) {
    return false
  }
  return true
}

export function createBreadcrumbs(basePath: string, pagePath: string): string {
  const parts = pagePath.split("/")
  const breadcrumbs: string[] = [`[API](${basePath})`]
  let currentPath = ""

  for (const part of parts.slice(0, -1)) {
    currentPath = currentPath.length > 0 ? `${currentPath}/${part}` : part
    breadcrumbs.push(`[${part}](${basePath}/${currentPath})`)
  }

  const leaf = parts.at(-1)
  if (leaf != null) {
    breadcrumbs.push(leaf)
  }

  return breadcrumbs.join(" / ")
}

export function createNavigationLine(params: {
  basePath: string
  kind: ReflectionKind
  navigation: ReflectionNavigation
}): null | string {
  const { basePath, kind, navigation } = params
  const prefix = getGroupUrlPrefix(kind)
  const prevLink =
    navigation.prev == null
      ? ""
      : `[← ${navigation.prev.name}](${buildLink(basePath, prefix, getSlug(navigation.prev.name))})`
  const nextLink =
    navigation.next == null
      ? ""
      : `[${navigation.next.name} →](${buildLink(basePath, prefix, getSlug(navigation.next.name))})`

  if (prevLink.length > 0 && nextLink.length > 0) {
    return `${prevLink} | ${nextLink}`
  }

  if (prevLink.length > 0) {
    return prevLink
  }

  if (nextLink.length > 0) {
    return nextLink
  }

  return null
}
