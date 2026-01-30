import {
  Application,
  TSConfigReader,
  TypeDocReader,
  type ProjectReflection,
  ReflectionKind,
  type DeclarationReflection,
  type SignatureReflection,
  type TypeParameterReflection,
} from "typedoc"
import path from "path"
import fs from "fs/promises"
import type { TypeDocConfig, GeneratedApiDoc } from "./types"

export class TypeDocGenerator {
  private config: TypeDocConfig
  private app: Application | undefined
  private project: ProjectReflection | undefined
  private basePath: string

  constructor(config: TypeDocConfig) {
    this.config = {
      out: "api",
      excludeExternals: true,
      excludePrivate: true,
      excludeProtected: false,
      excludeInternal: true,
      sort: ["source-order"],
      sidebar: {
        title: "API Reference",
        position: 100,
        collapsed: false,
      },
      markdown: {
        breadcrumbs: true,
        hierarchy: true,
        sourceLinks: true,
        codeBlocks: true,
      },
      ...config,
    }
    // Use the output directory as the base path for links
    this.basePath = "/" + this.config.out!
  }

  async generate(outputDir: string): Promise<GeneratedApiDoc[]> {
    const typedocOptions: Record<string, unknown> = {
      entryPoints: this.config.entryPoints,
      tsconfig: this.config.tsconfig,
      excludeExternals: this.config.excludeExternals,
      excludePrivate: this.config.excludePrivate,
      excludeProtected: this.config.excludeProtected,
      excludeInternal: this.config.excludeInternal,
      sort: this.config.sort,
    }

    // Only pass array/string options when explicitly set to avoid
    // TypeDoc errors like "option must be set to an array of strings"
    if (this.config.exclude) typedocOptions.exclude = this.config.exclude
    if (this.config.categoryOrder) typedocOptions.categoryOrder = this.config.categoryOrder
    if (this.config.groupOrder) typedocOptions.groupOrder = this.config.groupOrder
    if (this.config.plugin) typedocOptions.plugin = this.config.plugin
    if (this.config.readme) typedocOptions.readme = this.config.readme

    this.app = await Application.bootstrapWithPlugins(typedocOptions, [
      new TSConfigReader(),
      new TypeDocReader(),
    ])

    this.project = await this.app.convert()

    if (!this.project) {
      throw new Error("TypeDoc conversion failed")
    }

    const docs = this.generateMarkdownDocs()
    const apiDir = path.join(outputDir, this.config.out!)

    await fs.mkdir(apiDir, { recursive: true })

    for (const doc of docs) {
      const filePath = path.join(apiDir, doc.path)
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      const frontmatterLines = [
        "---",
        `title: ${doc.frontmatter.title}`,
        doc.frontmatter.description ? `description: ${doc.frontmatter.description}` : null,
        doc.frontmatter.sidebar_position !== undefined
          ? `sidebar_position: ${doc.frontmatter.sidebar_position}`
          : null,
        "---",
      ].filter((line): line is string => line !== null)

      const frontmatter = frontmatterLines.join("\n") + "\n\n"

      await fs.writeFile(filePath, frontmatter + doc.content)
    }

    return docs
  }

  private generateMarkdownDocs(): GeneratedApiDoc[] {
    if (!this.project) return []

    const docs: GeneratedApiDoc[] = []

    // Generate index page
    docs.push(this.generateIndexPage())

    const children = this.project.children || []

    // Group functions and type aliases by source file
    // React components (PascalCase) get their own pages
    const functionsByFile = new Map<string, DeclarationReflection[]>()
    const typesByFile = new Map<string, DeclarationReflection[]>()
    const componentItems: DeclarationReflection[] = []
    const standaloneItems: DeclarationReflection[] = []

    for (const child of children) {
      const sourceFile = child.sources?.[0]?.fileName

      if (child.kind === ReflectionKind.Function && sourceFile) {
        // React components are PascalCase and get individual pages
        if (this.isReactComponent(child.name)) {
          componentItems.push(child)
        } else {
          const existing = functionsByFile.get(sourceFile) || []
          existing.push(child)
          functionsByFile.set(sourceFile, existing)
        }
      } else if (child.kind === ReflectionKind.TypeAlias && sourceFile) {
        const existing = typesByFile.get(sourceFile) || []
        existing.push(child)
        typesByFile.set(sourceFile, existing)
      } else {
        standaloneItems.push(child)
      }
    }

    // Generate grouped pages for functions (by source file)
    for (const [sourceFile, functions] of functionsByFile) {
      docs.push(this.generateGroupedFunctionsPage(sourceFile, functions))
    }

    // Generate grouped pages for types (by source file)
    for (const [sourceFile, types] of typesByFile) {
      docs.push(this.generateGroupedTypesPage(sourceFile, types))
    }

    // Generate individual pages for React components
    // Sort alphabetically for consistent prev/next navigation
    const sortedComponents = [...componentItems].sort((a, b) => a.name.localeCompare(b.name))
    for (let i = 0; i < sortedComponents.length; i++) {
      const prev = i > 0 ? sortedComponents[i - 1] : null
      const next = i < sortedComponents.length - 1 ? sortedComponents[i + 1] : null
      docs.push(this.generateComponentPage(sortedComponents[i], prev, next))
    }

    // Group standalone items by kind for prev/next navigation within each group
    const itemsByKind = new Map<number, DeclarationReflection[]>()
    for (const child of standaloneItems) {
      const kind = child.kind
      const existing = itemsByKind.get(kind) || []
      existing.push(child)
      itemsByKind.set(kind, existing)
    }

    // Generate individual pages for classes, interfaces, enums, etc. with prev/next within group
    for (const [, items] of itemsByKind) {
      const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name))
      for (let i = 0; i < sortedItems.length; i++) {
        const prev = i > 0 ? sortedItems[i - 1] : null
        const next = i < sortedItems.length - 1 ? sortedItems[i + 1] : null
        docs.push(...this.generateReflectionDocs(sortedItems[i], "", prev, next))
      }
    }

    return docs
  }

  private generateGroupedFunctionsPage(
    sourceFile: string,
    functions: DeclarationReflection[]
  ): GeneratedApiDoc {
    // Extract module name from source file path (e.g., "src/utils/string.ts" -> "string")
    const moduleName = this.getModuleNameFromPath(sourceFile)
    const slug = this.getSlug(moduleName)
    const content: string[] = []

    content.push(`# ${moduleName} Functions`)
    content.push("")
    content.push(`Functions exported from \`${sourceFile}\``)
    content.push("")

    // Sort functions alphabetically
    const sortedFunctions = [...functions].sort((a, b) => a.name.localeCompare(b.name))

    for (const func of sortedFunctions) {
      content.push(`## ${func.name}`)
      content.push("")

      // Description
      if (func.comment?.summary) {
        content.push(this.renderComment(func.comment.summary))
        content.push("")
      }

      // Signature
      if (func.signatures) {
        for (const sig of func.signatures) {
          content.push(this.renderSignature(sig))
          content.push("")
        }
      }

      // Examples
      if (func.comment?.blockTags) {
        const examples = func.comment.blockTags.filter((t) => t.tag === "@example")
        if (examples.length > 0) {
          content.push("### Example")
          content.push("")
          for (const example of examples) {
            content.push(this.renderComment(example.content))
            content.push("")
          }
        }
      }

      // Source link
      if (this.config.markdown?.sourceLinks && func.sources?.[0]) {
        const source = func.sources[0]
        const sourceUrl = this.getSourceUrl(source.fileName, source.line)
        if (sourceUrl) {
          content.push(`[Source](${sourceUrl})`)
          content.push("")
        }
      }

      content.push("---")
      content.push("")
    }

    return {
      path: `functions/${slug}.md`,
      content: content.join("\n"),
      frontmatter: {
        title: `${moduleName} Functions`,
        description: `Functions from ${sourceFile}`,
      },
    }
  }

  private generateGroupedTypesPage(
    sourceFile: string,
    types: DeclarationReflection[]
  ): GeneratedApiDoc {
    const moduleName = this.getModuleNameFromPath(sourceFile)
    const slug = this.getSlug(moduleName)
    const content: string[] = []

    content.push(`# ${moduleName} Types`)
    content.push("")
    content.push(`Type definitions from \`${sourceFile}\``)
    content.push("")

    // Sort types alphabetically
    const sortedTypes = [...types].sort((a, b) => a.name.localeCompare(b.name))

    for (const typeAlias of sortedTypes) {
      content.push(`## ${typeAlias.name}`)
      content.push("")

      // Description
      if (typeAlias.comment?.summary) {
        content.push(this.renderComment(typeAlias.comment.summary))
        content.push("")
      }

      // Type definition
      if (typeAlias.type) {
        content.push("```typescript")
        content.push(`type ${typeAlias.name} = ${typeAlias.type.toString()}`)
        content.push("```")
        content.push("")
      }

      // Source link
      if (this.config.markdown?.sourceLinks && typeAlias.sources?.[0]) {
        const source = typeAlias.sources[0]
        const sourceUrl = this.getSourceUrl(source.fileName, source.line)
        if (sourceUrl) {
          content.push(`[Source](${sourceUrl})`)
          content.push("")
        }
      }

      content.push("---")
      content.push("")
    }

    return {
      path: `types/${slug}.md`,
      content: content.join("\n"),
      frontmatter: {
        title: `${moduleName} Types`,
        description: `Type definitions from ${sourceFile}`,
      },
    }
  }

  private getModuleNameFromPath(filePath: string): string {
    // Include parent directory to avoid naming conflicts
    // "src/utils/string.ts" -> "utils/string"
    // "src/ui/Sidebar.tsx" -> "ui/Sidebar"
    // "runtime/sidebar.ts" -> "runtime/sidebar"
    const parts = filePath.split("/")
    const basename = (parts.pop() || filePath).replace(/\.(ts|tsx|js|jsx)$/, "")

    // Get parent directory if available
    const parent = parts.pop()
    if (parent && parent !== "src") {
      return `${parent}/${basename}`
    }
    return basename
  }

  private generateIndexPage(): GeneratedApiDoc {
    const content = [
      `# ${this.config.sidebar?.title || "API Reference"}`,
      "",
      this.project?.comment?.summary
        ? this.renderComment(this.project.comment.summary)
        : "Auto-generated API documentation.",
      "",
    ]

    const children = this.project?.children || []

    // Group functions and types by source file for linking
    // Separate React components from regular functions
    const functionsByFile = new Map<string, DeclarationReflection[]>()
    const typesByFile = new Map<string, DeclarationReflection[]>()
    const componentItems: DeclarationReflection[] = []
    const standaloneItems: DeclarationReflection[] = []

    for (const child of children) {
      const sourceFile = child.sources?.[0]?.fileName

      if (child.kind === ReflectionKind.Function && sourceFile) {
        if (this.isReactComponent(child.name)) {
          componentItems.push(child)
        } else {
          const existing = functionsByFile.get(sourceFile) || []
          existing.push(child)
          functionsByFile.set(sourceFile, existing)
        }
      } else if (child.kind === ReflectionKind.TypeAlias && sourceFile) {
        const existing = typesByFile.get(sourceFile) || []
        existing.push(child)
        typesByFile.set(sourceFile, existing)
      } else {
        standaloneItems.push(child)
      }
    }

    // Render components
    if (componentItems.length > 0) {
      content.push("## Components")
      content.push("")

      const sortedComponents = [...componentItems].sort((a, b) => a.name.localeCompare(b.name))

      for (const component of sortedComponents) {
        const description = component.comment?.summary
          ? this.renderCommentShort(component.comment.summary)
          : ""
        const descSuffix = description ? ` - ${description}` : ""
        content.push(
          `- [${component.name}](${this.basePath}/components/${this.getSlug(component.name)})${descSuffix}`
        )
      }

      content.push("")
    }

    // Render grouped function modules
    if (functionsByFile.size > 0) {
      content.push("## Functions")
      content.push("")

      // Sort modules alphabetically
      const sortedModules = [...functionsByFile.entries()].sort((a, b) =>
        this.getModuleNameFromPath(a[0]).localeCompare(this.getModuleNameFromPath(b[0]))
      )

      for (const [sourceFile, functions] of sortedModules) {
        const moduleName = this.getModuleNameFromPath(sourceFile)
        const slug = this.getSlug(moduleName)
        const funcNames = functions
          .map((f) => f.name)
          .sort()
          .join(", ")
        content.push(`- [${moduleName}](${this.basePath}/functions/${slug}) - ${funcNames}`)
      }

      content.push("")
    }

    // Render grouped type modules
    if (typesByFile.size > 0) {
      content.push("## Type Aliases")
      content.push("")

      const sortedModules = [...typesByFile.entries()].sort((a, b) =>
        this.getModuleNameFromPath(a[0]).localeCompare(this.getModuleNameFromPath(b[0]))
      )

      for (const [sourceFile, types] of sortedModules) {
        const moduleName = this.getModuleNameFromPath(sourceFile)
        const slug = this.getSlug(moduleName)
        const typeNames = types
          .map((t) => t.name)
          .sort()
          .join(", ")
        content.push(`- [${moduleName}](${this.basePath}/types/${slug}) - ${typeNames}`)
      }

      content.push("")
    }

    // Group remaining items by kind
    const groups: Record<string, DeclarationReflection[]> = {}

    for (const child of standaloneItems) {
      const kindName = this.getKindGroupName(child.kind, child.name)
      if (!groups[kindName]) {
        groups[kindName] = []
      }
      groups[kindName].push(child)
    }

    // Sort each group alphabetically
    for (const group of Object.values(groups)) {
      group.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Define the order of groups (excluding Functions and Types which are handled above)
    const groupOrder = ["Interfaces", "Classes", "Variables", "Enums", "Other"]

    // Render each group
    for (const groupName of groupOrder) {
      const group = groups[groupName]
      if (!group || group.length === 0) continue

      content.push(`## ${groupName}`)
      content.push("")

      for (const child of group) {
        const description = child.comment?.summary
          ? this.renderCommentShort(child.comment.summary)
          : ""
        const descSuffix = description ? ` - ${description}` : ""
        const groupUrlPrefix = this.getGroupUrlPrefix(child.kind)
        content.push(
          `- [${child.name}](${this.basePath}/${groupUrlPrefix}/${this.getSlug(child.name)})${descSuffix}`
        )
      }

      content.push("")
    }

    return {
      path: "index.md",
      content: content.join("\n"),
      frontmatter: {
        title: this.config.sidebar?.title || "API Reference",
        description: "Auto-generated API documentation",
        sidebar_position: 0,
      },
    }
  }

  private getKindGroupName(kind: ReflectionKind, name: string): string {
    // Group hooks and components separately from regular functions
    if (kind === ReflectionKind.Function) {
      // React hooks start with "use"
      if (name.startsWith("use")) {
        return "React Hooks"
      }
      // React components are PascalCase and typically don't start with lowercase
      if (name[0] === name[0].toUpperCase() && !name.includes("_")) {
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

  private generateReflectionDocs(
    reflection: DeclarationReflection,
    parentPath: string,
    prev: DeclarationReflection | null = null,
    next: DeclarationReflection | null = null
  ): GeneratedApiDoc[] {
    const docs: GeneratedApiDoc[] = []
    const slug = this.getSlug(reflection.name)
    // Use group prefix (e.g., "interfaces", "classes") when at top level
    const groupPrefix = parentPath ? "" : this.getGroupUrlPrefix(reflection.kind)
    const currentPath = parentPath
      ? `${parentPath}/${slug}`
      : groupPrefix
        ? `${groupPrefix}/${slug}`
        : slug

    // Generate main page for this reflection
    docs.push(this.generateReflectionPage(reflection, currentPath, prev, next))

    // Generate pages for child classes, interfaces, etc.
    // Functions are grouped by source file, not individual pages
    const children = reflection.children || []
    const hasOwnPage = [
      ReflectionKind.Class,
      ReflectionKind.Interface,
      ReflectionKind.Enum,
      ReflectionKind.Namespace,
      ReflectionKind.Module,
    ]

    for (const child of children) {
      if (hasOwnPage.includes(child.kind)) {
        docs.push(...this.generateReflectionDocs(child, currentPath))
      }
    }

    return docs
  }

  private generateReflectionPage(
    reflection: DeclarationReflection,
    pagePath: string,
    prev: DeclarationReflection | null = null,
    next: DeclarationReflection | null = null
  ): GeneratedApiDoc {
    const kind = this.getKindName(reflection.kind)
    const content: string[] = []

    // Breadcrumbs
    if (this.config.markdown?.breadcrumbs) {
      content.push(this.generateBreadcrumbs(pagePath))
      content.push("")
    }

    // Title
    content.push(`# ${kind}: ${reflection.name}`)
    content.push("")

    // Description
    if (reflection.comment?.summary) {
      content.push(this.renderComment(reflection.comment.summary))
      content.push("")
    }

    // Type parameters
    if (reflection.typeParameters && reflection.typeParameters.length > 0) {
      content.push("## Type Parameters")
      content.push("")
      content.push(this.renderTypeParameters(reflection.typeParameters))
      content.push("")
    }

    // Hierarchy
    if (this.config.markdown?.hierarchy) {
      const hierarchy = this.renderHierarchy(reflection)
      if (hierarchy) {
        content.push("## Hierarchy")
        content.push("")
        content.push(hierarchy)
        content.push("")
      }
    }

    // Signature (for functions)
    if (reflection.signatures) {
      content.push("## Signature")
      content.push("")
      for (const sig of reflection.signatures) {
        content.push(this.renderSignature(sig))
        content.push("")
      }
    }

    // Properties
    const properties = (reflection.children || []).filter((c) => c.kind === ReflectionKind.Property)
    if (properties.length > 0) {
      content.push("## Properties")
      content.push("")
      for (const prop of properties) {
        content.push(this.renderProperty(prop))
        content.push("")
      }
    }

    // Methods
    const methods = (reflection.children || []).filter((c) => c.kind === ReflectionKind.Method)
    if (methods.length > 0) {
      content.push("## Methods")
      content.push("")
      for (const method of methods) {
        content.push(this.renderMethod(method))
        content.push("")
      }
    }

    // Enum members
    const enumMembers = (reflection.children || []).filter(
      (c) => c.kind === ReflectionKind.EnumMember
    )
    if (enumMembers.length > 0) {
      content.push("## Members")
      content.push("")
      content.push("| Member | Value | Description |")
      content.push("|--------|-------|-------------|")
      for (const member of enumMembers) {
        const value = member.defaultValue || ""
        const desc = member.comment?.summary ? this.renderCommentShort(member.comment.summary) : ""
        content.push(`| \`${member.name}\` | \`${value}\` | ${desc} |`)
      }
      content.push("")
    }

    // Type alias definition
    if (reflection.kind === ReflectionKind.TypeAlias && reflection.type) {
      content.push("## Type")
      content.push("")
      content.push("```typescript")
      content.push(`type ${reflection.name} = ${reflection.type.toString()}`)
      content.push("```")
      content.push("")
    }

    // Source link
    if (this.config.markdown?.sourceLinks && reflection.sources?.[0]) {
      const source = reflection.sources[0]
      const sourceUrl = this.getSourceUrl(source.fileName, source.line)
      content.push("## Source")
      content.push("")
      if (sourceUrl) {
        content.push(`[${source.fileName}:${source.line}](${sourceUrl})`)
      } else {
        content.push(`${source.fileName}:${source.line}`)
      }
      content.push("")
    }

    // Tags (deprecated, example, etc.)
    if (reflection.comment?.blockTags) {
      const examples = reflection.comment.blockTags.filter((t) => t.tag === "@example")
      if (examples.length > 0) {
        content.push("## Examples")
        content.push("")
        for (const example of examples) {
          content.push(this.renderComment(example.content))
          content.push("")
        }
      }

      const deprecated = reflection.comment.blockTags.find((t) => t.tag === "@deprecated")
      if (deprecated) {
        content.push(":::warning Deprecated")
        content.push(this.renderComment(deprecated.content))
        content.push(":::")
        content.push("")
      }

      const see = reflection.comment.blockTags.filter((t) => t.tag === "@see")
      if (see.length > 0) {
        content.push("## See Also")
        content.push("")
        for (const s of see) {
          content.push(`- ${this.renderComment(s.content)}`)
        }
        content.push("")
      }
    }

    // Prev/Next navigation within group
    if (prev || next) {
      content.push("---")
      content.push("")
      const groupPrefix = this.getGroupUrlPrefix(reflection.kind)
      const prevLink = prev
        ? `[← ${prev.name}](${this.basePath}/${groupPrefix}/${this.getSlug(prev.name)})`
        : ""
      const nextLink = next
        ? `[${next.name} →](${this.basePath}/${groupPrefix}/${this.getSlug(next.name)})`
        : ""
      if (prev && next) {
        content.push(`${prevLink} | ${nextLink}`)
      } else {
        content.push(prevLink || nextLink)
      }
      content.push("")
    }

    return {
      path: `${pagePath}.md`,
      content: content.join("\n"),
      frontmatter: {
        title: reflection.name,
        description: reflection.comment?.summary
          ? this.renderCommentShort(reflection.comment.summary)
          : `${kind} ${reflection.name}`,
      },
    }
  }

  private renderSignature(sig: SignatureReflection): string {
    const lines: string[] = []

    if (this.config.markdown?.codeBlocks) {
      lines.push("```typescript")
    }

    const typeParams = sig.typeParameters
      ? `<${sig.typeParameters.map((tp) => tp.name).join(", ")}>`
      : ""

    const params = (sig.parameters || [])
      .map((p) => {
        const optional = p.flags.isOptional ? "?" : ""
        const type = p.type ? `: ${p.type.toString()}` : ""
        return `${p.name}${optional}${type}`
      })
      .join(", ")

    const returnType = sig.type ? `: ${sig.type.toString()}` : ""

    lines.push(`function ${sig.name}${typeParams}(${params})${returnType}`)

    if (this.config.markdown?.codeBlocks) {
      lines.push("```")
    }

    // Parameters table
    if (sig.parameters && sig.parameters.length > 0) {
      lines.push("")
      lines.push("### Parameters")
      lines.push("")
      lines.push("| Name | Type | Description |")
      lines.push("|------|------|-------------|")

      for (const param of sig.parameters) {
        const type = param.type ? `\`${param.type.toString()}\`` : "-"
        const desc = param.comment?.summary ? this.renderCommentShort(param.comment.summary) : "-"
        const optional = param.flags.isOptional ? " (optional)" : ""
        lines.push(`| ${param.name}${optional} | ${type} | ${desc} |`)
      }
    }

    // Return value
    if (sig.type && sig.type.toString() !== "void") {
      lines.push("")
      lines.push("### Returns")
      lines.push("")
      lines.push(`\`${sig.type.toString()}\``)

      if (sig.comment?.blockTags) {
        const returns = sig.comment.blockTags.find((t) => t.tag === "@returns")
        if (returns) {
          lines.push("")
          lines.push(this.renderComment(returns.content))
        }
      }
    }

    return lines.join("\n")
  }

  private renderProperty(prop: DeclarationReflection): string {
    const lines: string[] = []

    const flags: string[] = []
    if (prop.flags.isOptional) flags.push("optional")
    if (prop.flags.isReadonly) flags.push("readonly")
    if (prop.flags.isStatic) flags.push("static")

    lines.push(`### ${prop.name}`)
    if (flags.length > 0) {
      lines.push(`*${flags.join(", ")}*`)
    }
    lines.push("")

    if (prop.type) {
      lines.push("```typescript")
      lines.push(`${prop.name}: ${prop.type.toString()}`)
      lines.push("```")
      lines.push("")
    }

    if (prop.comment?.summary) {
      lines.push(this.renderComment(prop.comment.summary))
    }

    if (prop.defaultValue) {
      lines.push("")
      lines.push(`**Default:** \`${prop.defaultValue}\``)
    }

    return lines.join("\n")
  }

  private renderMethod(method: DeclarationReflection): string {
    const lines: string[] = []

    lines.push(`### ${method.name}()`)
    lines.push("")

    if (method.signatures) {
      for (const sig of method.signatures) {
        if (sig.comment?.summary) {
          lines.push(this.renderComment(sig.comment.summary))
          lines.push("")
        }

        lines.push(this.renderSignature(sig))
        lines.push("")
      }
    }

    return lines.join("\n")
  }

  private renderTypeParameters(typeParams: TypeParameterReflection[]): string {
    const lines: string[] = []
    lines.push("| Name | Constraint | Default | Description |")
    lines.push("|------|------------|---------|-------------|")

    for (const tp of typeParams) {
      const constraint = tp.type ? `\`${tp.type.toString()}\`` : "-"
      const defaultVal = tp.default ? `\`${tp.default.toString()}\`` : "-"
      const desc = tp.comment?.summary ? this.renderCommentShort(tp.comment.summary) : "-"
      lines.push(`| ${tp.name} | ${constraint} | ${defaultVal} | ${desc} |`)
    }

    return lines.join("\n")
  }

  private renderHierarchy(reflection: DeclarationReflection): string | null {
    const lines: string[] = []

    if (reflection.extendedTypes && reflection.extendedTypes.length > 0) {
      lines.push("**Extends:**")
      for (const t of reflection.extendedTypes) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.implementedTypes && reflection.implementedTypes.length > 0) {
      lines.push("**Implements:**")
      for (const t of reflection.implementedTypes) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.extendedBy && reflection.extendedBy.length > 0) {
      lines.push("**Extended by:**")
      for (const t of reflection.extendedBy) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.implementedBy && reflection.implementedBy.length > 0) {
      lines.push("**Implemented by:**")
      for (const t of reflection.implementedBy) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    return lines.length > 0 ? lines.join("\n") : null
  }

  private renderComment(parts: { kind: string; text: string }[]): string {
    return parts.map((p) => p.text).join("")
  }

  private renderCommentShort(parts: { kind: string; text: string }[]): string {
    const text = this.renderComment(parts)
    const firstSentence = text.split(/[.!?]\s/)[0]
    return firstSentence.length < text.length ? firstSentence + "." : text
  }

  private generateBreadcrumbs(pagePath: string): string {
    const parts = pagePath.split("/")
    const breadcrumbs: string[] = [`[API](${this.basePath})`]

    let currentPath = ""
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (currentPath ? "/" : "") + parts[i]
      breadcrumbs.push(`[${parts[i]}](${this.basePath}/${currentPath})`)
    }

    breadcrumbs.push(parts[parts.length - 1])

    return breadcrumbs.join(" / ")
  }

  private getKindName(kind: ReflectionKind): string {
    const kindNames: Partial<Record<ReflectionKind, string>> = {
      [ReflectionKind.Class]: "Class",
      [ReflectionKind.Interface]: "Interface",
      [ReflectionKind.Enum]: "Enum",
      [ReflectionKind.TypeAlias]: "Type",
      [ReflectionKind.Function]: "Function",
      [ReflectionKind.Variable]: "Variable",
      [ReflectionKind.Namespace]: "Namespace",
      [ReflectionKind.Module]: "Module",
      [ReflectionKind.Property]: "Property",
      [ReflectionKind.Method]: "Method",
    }
    return kindNames[kind] || "Unknown"
  }

  private getGroupUrlPrefix(kind: ReflectionKind): string {
    const prefixes: Partial<Record<ReflectionKind, string>> = {
      [ReflectionKind.Class]: "classes",
      [ReflectionKind.Interface]: "interfaces",
      [ReflectionKind.Enum]: "enums",
      [ReflectionKind.Variable]: "variables",
      [ReflectionKind.Namespace]: "namespaces",
      [ReflectionKind.Module]: "modules",
    }
    return prefixes[kind] || "other"
  }

  private getSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  private getSourceUrl(fileName: string, line: number): string | null {
    if (!this.config.markdown?.sourceBaseUrl) return null
    const baseUrl = this.config.markdown.sourceBaseUrl.replace(/\/$/, "")
    return `${baseUrl}/${fileName}#L${line}`
  }

  /**
   * Check if a function name looks like a React component (PascalCase)
   */
  private isReactComponent(name: string): boolean {
    // React components start with uppercase and don't contain underscores
    // Also check for common component patterns
    if (name[0] !== name[0].toUpperCase()) return false
    if (name.includes("_")) return false
    // Exclude common non-component patterns
    if (name.startsWith("use")) return false // hooks
    if (name.endsWith("Props") || name.endsWith("Options") || name.endsWith("Config")) return false
    return true
  }

  /**
   * Generate a page for a React component
   */
  private generateComponentPage(
    component: DeclarationReflection,
    prev: DeclarationReflection | null,
    next: DeclarationReflection | null
  ): GeneratedApiDoc {
    const slug = this.getSlug(component.name)
    const groupPrefix = "components"
    const content: string[] = []

    content.push(`# ${component.name}`)
    content.push("")

    // Description
    if (component.comment?.summary) {
      content.push(this.renderComment(component.comment.summary))
      content.push("")
    }

    // Signature
    if (component.signatures) {
      content.push("## Usage")
      content.push("")
      for (const sig of component.signatures) {
        content.push(this.renderComponentSignature(sig, component.name))
        content.push("")
      }
    }

    // Examples
    if (component.comment?.blockTags) {
      const examples = component.comment.blockTags.filter((t) => t.tag === "@example")
      if (examples.length > 0) {
        content.push("## Example")
        content.push("")
        for (const example of examples) {
          content.push(this.renderComment(example.content))
          content.push("")
        }
      }
    }

    // Source link
    if (this.config.markdown?.sourceLinks && component.sources?.[0]) {
      const source = component.sources[0]
      const sourceUrl = this.getSourceUrl(source.fileName, source.line)
      if (sourceUrl) {
        content.push(`[Source](${sourceUrl})`)
        content.push("")
      }
    }

    // Prev/Next navigation
    if (prev || next) {
      content.push("---")
      content.push("")
      const prevLink = prev
        ? `[← ${prev.name}](${this.basePath}/${groupPrefix}/${this.getSlug(prev.name)})`
        : ""
      const nextLink = next
        ? `[${next.name} →](${this.basePath}/${groupPrefix}/${this.getSlug(next.name)})`
        : ""
      if (prev && next) {
        content.push(`${prevLink} | ${nextLink}`)
      } else {
        content.push(prevLink || nextLink)
      }
      content.push("")
    }

    return {
      path: `${groupPrefix}/${slug}.md`,
      content: content.join("\n"),
      frontmatter: {
        title: component.name,
        description: component.comment?.summary
          ? this.renderCommentShort(component.comment.summary)
          : `${component.name} component`,
      },
    }
  }

  /**
   * Get the name of a TypeDoc type (handles reference types, etc.)
   */
  private getTypeName(paramType: unknown): string | null {
    if (!paramType || typeof paramType !== "object") return null

    // Direct name property
    if ("name" in paramType && typeof (paramType as { name: unknown }).name === "string") {
      return (paramType as { name: string }).name
    }

    // Reference type with target
    if ("type" in paramType && (paramType as { type: string }).type === "reference") {
      const refType = paramType as { name?: string; qualifiedName?: string }
      return refType.name || refType.qualifiedName || null
    }

    return null
  }

  /**
   * Get props from a component's parameter type
   */
  private getPropsFromType(
    paramType: unknown
  ): Array<{ name: string; type: string; optional: boolean; description: string }> {
    const props: Array<{ name: string; type: string; optional: boolean; description: string }> = []

    // Check if it's a reflection type with inline declaration
    if (paramType && typeof paramType === "object" && "declaration" in paramType) {
      const declaration = (paramType as { declaration: DeclarationReflection }).declaration
      const children = declaration.children || []
      for (const child of children) {
        props.push({
          name: child.name,
          type: child.type ? child.type.toString() : "unknown",
          optional: child.flags.isOptional,
          description: child.comment?.summary ? this.renderCommentShort(child.comment.summary) : "",
        })
      }
    }
    // Check if it's a reference type - look up the interface in the project
    else {
      const typeName = this.getTypeName(paramType)
      if (typeName) {
        // Find the interface/type alias in the project
        let propsInterface = this.project?.getChildByName(typeName)

        // If not found directly, search all children
        if (!propsInterface && this.project?.children) {
          for (const child of this.project.children) {
            if (child.name === typeName) {
              propsInterface = child
              break
            }
          }
        }

        if (propsInterface && "children" in propsInterface) {
          const children = (propsInterface as DeclarationReflection).children || []
          for (const child of children) {
            props.push({
              name: child.name,
              type: child.type ? child.type.toString() : "unknown",
              optional: child.flags.isOptional,
              description: child.comment?.summary
                ? this.renderCommentShort(child.comment.summary)
                : "",
            })
          }
        }
      }
    }

    return props
  }

  /**
   * Render a component signature in a more readable format
   */
  private renderComponentSignature(sig: SignatureReflection, componentName: string): string {
    const lines: string[] = []

    // Get props from the first parameter
    const propsParam = sig.parameters?.[0]
    const props = propsParam ? this.getPropsFromType(propsParam.type) : []

    // Get the props interface name for linking
    const propsTypeName = propsParam?.type ? this.getTypeName(propsParam.type) : null

    // Check if component has children prop
    const hasChildren = props.some((p) => p.name === "children")
    // Filter out children from props display (shown in JSX structure instead)
    const displayProps = props.filter((p) => p.name !== "children")

    lines.push("```tsx")
    lines.push(`<${componentName}`)

    if (displayProps.length > 0) {
      for (const prop of displayProps) {
        const optMark = prop.optional ? "?" : ""
        lines.push(`  ${prop.name}${optMark}={${prop.type}}`)
      }
    } else if (!hasChildren) {
      lines.push(`  {...props}`)
    }

    if (hasChildren) {
      lines.push(`>`)
      lines.push(`  {children}`)
      lines.push(`</${componentName}>`)
    } else {
      lines.push(`/>`)
    }
    lines.push("```")

    // Props table with link to props interface
    if (props.length > 0) {
      lines.push("")
      if (propsTypeName) {
        lines.push(`## [Props](${this.basePath}/interfaces/${this.getSlug(propsTypeName)})`)
      } else {
        lines.push("## Props")
      }
      lines.push("")
      lines.push("| Prop | Type | Required | Description |")
      lines.push("|------|------|----------|-------------|")

      for (const prop of props) {
        const type = `\`${prop.type}\``
        const required = prop.optional ? "No" : "Yes"
        const desc = prop.description || "-"
        lines.push(`| ${prop.name} | ${type} | ${required} | ${desc} |`)
      }
    }

    // Skip return value for components - it's always Element/JSX.Element

    return lines.join("\n")
  }
}

export async function generateApiDocs(
  config: TypeDocConfig,
  outputDir: string
): Promise<GeneratedApiDoc[]> {
  const generator = new TypeDocGenerator(config)
  return generator.generate(outputDir)
}
