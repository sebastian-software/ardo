import type { ApiDeclaration, DeclarationDocsResult } from "./types"

/** Heading level of a kind group: below an import path, or directly under the title. */
type SectionHeading = "##" | "###"

/**
 * The API index lists every page by kind. With import paths, it groups by
 * import path first, in the order of the entry points.
 */
export function renderIndex(
  items: ApiDeclaration[],
  options: { paths: Map<ApiDeclaration, string>; out: string; title: string }
): DeclarationDocsResult["pages"][number] {
  const lines = [`# ${options.title}`, ""]
  const byImport = new Map<string | undefined, ApiDeclaration[]>()
  for (const item of items) {
    const group = byImport.get(item.importPath) ?? []
    group.push(item)
    byImport.set(item.importPath, group)
  }
  const grouped = !(byImport.size === 1 && byImport.has(undefined))
  for (const [importPath, group] of byImport) {
    if (grouped) lines.push(`## ${importPath == null ? "Other exports" : `\`${importPath}\``}`, "")
    lines.push(...renderIndexKinds(group, options, grouped ? "###" : "##"))
  }
  return {
    path: "index.md",
    content: lines.join("\n"),
    frontmatter: { title: options.title, sidebar_position: 0 },
  }
}

function renderIndexKinds(
  items: ApiDeclaration[],
  options: { paths: Map<ApiDeclaration, string>; out: string },
  heading: SectionHeading
): string[] {
  const lines: string[] = []
  const groups = new Map<string, ApiDeclaration[]>()
  for (const item of items) {
    const label =
      item.kind === "class"
        ? "Classes"
        : item.kind === "type"
          ? "Types"
          : `${item.kind[0].toUpperCase()}${item.kind.slice(1)}s`
    const group = groups.get(label) ?? []
    group.push(item)
    groups.set(label, group)
  }
  for (const [label, group] of groups) {
    lines.push(`${heading} ${label}`, "")
    for (const item of group) {
      const file = options.paths.get(item) ?? ""
      lines.push(`- [${item.name}](/${options.out}/${file.slice(0, -3)})`)
    }
    lines.push("")
  }
  return lines
}
