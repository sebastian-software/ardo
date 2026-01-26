import {
  Application,
  TSConfigReader,
  TypeDocReader,
  type ProjectReflection,
  ReflectionKind,
  type DeclarationReflection,
  type SignatureReflection,
  type TypeParameterReflection,
} from 'typedoc'
import path from 'path'
import fs from 'fs/promises'
import type { TypeDocConfig, GeneratedApiDoc } from './types'

export class TypeDocGenerator {
  private config: TypeDocConfig
  private app: Application | undefined
  private project: ProjectReflection | undefined
  private basePath: string

  constructor(config: TypeDocConfig) {
    this.config = {
      out: 'api',
      excludeExternals: true,
      excludePrivate: true,
      excludeProtected: false,
      excludeInternal: true,
      sort: ['source-order'],
      sidebar: {
        title: 'API Reference',
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
    this.basePath = '/' + this.config.out!
  }

  async generate(outputDir: string): Promise<GeneratedApiDoc[]> {
    this.app = await Application.bootstrapWithPlugins(
      {
        entryPoints: this.config.entryPoints,
        tsconfig: this.config.tsconfig,
        exclude: this.config.exclude,
        excludeExternals: this.config.excludeExternals,
        excludePrivate: this.config.excludePrivate,
        excludeProtected: this.config.excludeProtected,
        excludeInternal: this.config.excludeInternal,
        sort: this.config.sort,
        categoryOrder: this.config.categoryOrder,
        groupOrder: this.config.groupOrder,
        readme: this.config.readme,
        plugin: this.config.plugin,
      },
      [new TSConfigReader(), new TypeDocReader()]
    )

    this.project = await this.app.convert()

    if (!this.project) {
      throw new Error('TypeDoc conversion failed')
    }

    const docs = this.generateMarkdownDocs()
    const apiDir = path.join(outputDir, this.config.out!)

    await fs.mkdir(apiDir, { recursive: true })

    for (const doc of docs) {
      const filePath = path.join(apiDir, doc.path)
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      const frontmatter = [
        '---',
        `title: ${doc.frontmatter.title}`,
        doc.frontmatter.description ? `description: ${doc.frontmatter.description}` : '',
        doc.frontmatter.sidebar_position !== undefined
          ? `sidebar_position: ${doc.frontmatter.sidebar_position}`
          : '',
        '---',
        '',
      ]
        .filter(Boolean)
        .join('\n')

      await fs.writeFile(filePath, frontmatter + doc.content)
    }

    return docs
  }

  private generateMarkdownDocs(): GeneratedApiDoc[] {
    if (!this.project) return []

    const docs: GeneratedApiDoc[] = []

    // Generate index page
    docs.push(this.generateIndexPage())

    // Generate pages for each module/namespace
    const children = this.project.children || []

    for (const child of children) {
      docs.push(...this.generateReflectionDocs(child, ''))
    }

    return docs
  }

  private generateIndexPage(): GeneratedApiDoc {
    const content = [
      `# ${this.config.sidebar?.title || 'API Reference'}`,
      '',
      this.project?.comment?.summary
        ? this.renderComment(this.project.comment.summary)
        : 'Auto-generated API documentation.',
      '',
      '## Modules',
      '',
    ]

    const children = this.project?.children || []
    for (const child of children) {
      const description = child.comment?.summary
        ? this.renderCommentShort(child.comment.summary)
        : ''
      content.push(
        `- [${child.name}](${this.basePath}/${this.getSlug(child.name)}) - ${description}`
      )
    }

    return {
      path: 'index.md',
      content: content.join('\n'),
      frontmatter: {
        title: this.config.sidebar?.title || 'API Reference',
        description: 'Auto-generated API documentation',
        sidebar_position: 0,
      },
    }
  }

  private generateReflectionDocs(
    reflection: DeclarationReflection,
    parentPath: string
  ): GeneratedApiDoc[] {
    const docs: GeneratedApiDoc[] = []
    const slug = this.getSlug(reflection.name)
    const currentPath = parentPath ? `${parentPath}/${slug}` : slug

    // Generate main page for this reflection
    docs.push(this.generateReflectionPage(reflection, currentPath))

    // Generate pages for child classes, interfaces, etc.
    const children = reflection.children || []
    const hasOwnPage = [
      ReflectionKind.Class,
      ReflectionKind.Interface,
      ReflectionKind.Enum,
      ReflectionKind.TypeAlias,
      ReflectionKind.Function,
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
    pagePath: string
  ): GeneratedApiDoc {
    const kind = this.getKindName(reflection.kind)
    const content: string[] = []

    // Breadcrumbs
    if (this.config.markdown?.breadcrumbs) {
      content.push(this.generateBreadcrumbs(pagePath))
      content.push('')
    }

    // Title
    content.push(`# ${kind}: ${reflection.name}`)
    content.push('')

    // Description
    if (reflection.comment?.summary) {
      content.push(this.renderComment(reflection.comment.summary))
      content.push('')
    }

    // Type parameters
    if (reflection.typeParameters && reflection.typeParameters.length > 0) {
      content.push('## Type Parameters')
      content.push('')
      content.push(this.renderTypeParameters(reflection.typeParameters))
      content.push('')
    }

    // Hierarchy
    if (this.config.markdown?.hierarchy) {
      const hierarchy = this.renderHierarchy(reflection)
      if (hierarchy) {
        content.push('## Hierarchy')
        content.push('')
        content.push(hierarchy)
        content.push('')
      }
    }

    // Signature (for functions)
    if (reflection.signatures) {
      content.push('## Signature')
      content.push('')
      for (const sig of reflection.signatures) {
        content.push(this.renderSignature(sig))
        content.push('')
      }
    }

    // Properties
    const properties = (reflection.children || []).filter((c) => c.kind === ReflectionKind.Property)
    if (properties.length > 0) {
      content.push('## Properties')
      content.push('')
      for (const prop of properties) {
        content.push(this.renderProperty(prop))
        content.push('')
      }
    }

    // Methods
    const methods = (reflection.children || []).filter((c) => c.kind === ReflectionKind.Method)
    if (methods.length > 0) {
      content.push('## Methods')
      content.push('')
      for (const method of methods) {
        content.push(this.renderMethod(method))
        content.push('')
      }
    }

    // Enum members
    const enumMembers = (reflection.children || []).filter(
      (c) => c.kind === ReflectionKind.EnumMember
    )
    if (enumMembers.length > 0) {
      content.push('## Members')
      content.push('')
      content.push('| Member | Value | Description |')
      content.push('|--------|-------|-------------|')
      for (const member of enumMembers) {
        const value = member.defaultValue || ''
        const desc = member.comment?.summary ? this.renderCommentShort(member.comment.summary) : ''
        content.push(`| \`${member.name}\` | \`${value}\` | ${desc} |`)
      }
      content.push('')
    }

    // Type alias definition
    if (reflection.kind === ReflectionKind.TypeAlias && reflection.type) {
      content.push('## Type')
      content.push('')
      content.push('```typescript')
      content.push(`type ${reflection.name} = ${reflection.type.toString()}`)
      content.push('```')
      content.push('')
    }

    // Source link
    if (this.config.markdown?.sourceLinks && reflection.sources?.[0]) {
      const source = reflection.sources[0]
      const sourceUrl = this.getSourceUrl(source.fileName, source.line)
      content.push('## Source')
      content.push('')
      if (sourceUrl) {
        content.push(`[${source.fileName}:${source.line}](${sourceUrl})`)
      } else {
        content.push(`${source.fileName}:${source.line}`)
      }
      content.push('')
    }

    // Tags (deprecated, example, etc.)
    if (reflection.comment?.blockTags) {
      const examples = reflection.comment.blockTags.filter((t) => t.tag === '@example')
      if (examples.length > 0) {
        content.push('## Examples')
        content.push('')
        for (const example of examples) {
          content.push(this.renderComment(example.content))
          content.push('')
        }
      }

      const deprecated = reflection.comment.blockTags.find((t) => t.tag === '@deprecated')
      if (deprecated) {
        content.push(':::warning Deprecated')
        content.push(this.renderComment(deprecated.content))
        content.push(':::')
        content.push('')
      }

      const see = reflection.comment.blockTags.filter((t) => t.tag === '@see')
      if (see.length > 0) {
        content.push('## See Also')
        content.push('')
        for (const s of see) {
          content.push(`- ${this.renderComment(s.content)}`)
        }
        content.push('')
      }
    }

    return {
      path: `${pagePath}.md`,
      content: content.join('\n'),
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
      lines.push('```typescript')
    }

    const typeParams = sig.typeParameters
      ? `<${sig.typeParameters.map((tp) => tp.name).join(', ')}>`
      : ''

    const params = (sig.parameters || [])
      .map((p) => {
        const optional = p.flags.isOptional ? '?' : ''
        const type = p.type ? `: ${p.type.toString()}` : ''
        return `${p.name}${optional}${type}`
      })
      .join(', ')

    const returnType = sig.type ? `: ${sig.type.toString()}` : ''

    lines.push(`function ${sig.name}${typeParams}(${params})${returnType}`)

    if (this.config.markdown?.codeBlocks) {
      lines.push('```')
    }

    // Parameters table
    if (sig.parameters && sig.parameters.length > 0) {
      lines.push('')
      lines.push('### Parameters')
      lines.push('')
      lines.push('| Name | Type | Description |')
      lines.push('|------|------|-------------|')

      for (const param of sig.parameters) {
        const type = param.type ? `\`${param.type.toString()}\`` : '-'
        const desc = param.comment?.summary ? this.renderCommentShort(param.comment.summary) : '-'
        const optional = param.flags.isOptional ? ' (optional)' : ''
        lines.push(`| ${param.name}${optional} | ${type} | ${desc} |`)
      }
    }

    // Return value
    if (sig.type && sig.type.toString() !== 'void') {
      lines.push('')
      lines.push('### Returns')
      lines.push('')
      lines.push(`\`${sig.type.toString()}\``)

      if (sig.comment?.blockTags) {
        const returns = sig.comment.blockTags.find((t) => t.tag === '@returns')
        if (returns) {
          lines.push('')
          lines.push(this.renderComment(returns.content))
        }
      }
    }

    return lines.join('\n')
  }

  private renderProperty(prop: DeclarationReflection): string {
    const lines: string[] = []

    const flags: string[] = []
    if (prop.flags.isOptional) flags.push('optional')
    if (prop.flags.isReadonly) flags.push('readonly')
    if (prop.flags.isStatic) flags.push('static')

    lines.push(`### ${prop.name}`)
    if (flags.length > 0) {
      lines.push(`*${flags.join(', ')}*`)
    }
    lines.push('')

    if (prop.type) {
      lines.push('```typescript')
      lines.push(`${prop.name}: ${prop.type.toString()}`)
      lines.push('```')
      lines.push('')
    }

    if (prop.comment?.summary) {
      lines.push(this.renderComment(prop.comment.summary))
    }

    if (prop.defaultValue) {
      lines.push('')
      lines.push(`**Default:** \`${prop.defaultValue}\``)
    }

    return lines.join('\n')
  }

  private renderMethod(method: DeclarationReflection): string {
    const lines: string[] = []

    lines.push(`### ${method.name}()`)
    lines.push('')

    if (method.signatures) {
      for (const sig of method.signatures) {
        if (sig.comment?.summary) {
          lines.push(this.renderComment(sig.comment.summary))
          lines.push('')
        }

        lines.push(this.renderSignature(sig))
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  private renderTypeParameters(typeParams: TypeParameterReflection[]): string {
    const lines: string[] = []
    lines.push('| Name | Constraint | Default | Description |')
    lines.push('|------|------------|---------|-------------|')

    for (const tp of typeParams) {
      const constraint = tp.type ? `\`${tp.type.toString()}\`` : '-'
      const defaultVal = tp.default ? `\`${tp.default.toString()}\`` : '-'
      const desc = tp.comment?.summary ? this.renderCommentShort(tp.comment.summary) : '-'
      lines.push(`| ${tp.name} | ${constraint} | ${defaultVal} | ${desc} |`)
    }

    return lines.join('\n')
  }

  private renderHierarchy(reflection: DeclarationReflection): string | null {
    const lines: string[] = []

    if (reflection.extendedTypes && reflection.extendedTypes.length > 0) {
      lines.push('**Extends:**')
      for (const t of reflection.extendedTypes) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.implementedTypes && reflection.implementedTypes.length > 0) {
      lines.push('**Implements:**')
      for (const t of reflection.implementedTypes) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.extendedBy && reflection.extendedBy.length > 0) {
      lines.push('**Extended by:**')
      for (const t of reflection.extendedBy) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    if (reflection.implementedBy && reflection.implementedBy.length > 0) {
      lines.push('**Implemented by:**')
      for (const t of reflection.implementedBy) {
        lines.push(`- \`${t.toString()}\``)
      }
    }

    return lines.length > 0 ? lines.join('\n') : null
  }

  private renderComment(parts: { kind: string; text: string }[]): string {
    return parts.map((p) => p.text).join('')
  }

  private renderCommentShort(parts: { kind: string; text: string }[]): string {
    const text = this.renderComment(parts)
    const firstSentence = text.split(/[.!?]\s/)[0]
    return firstSentence.length < text.length ? firstSentence + '.' : text
  }

  private generateBreadcrumbs(pagePath: string): string {
    const parts = pagePath.split('/')
    const breadcrumbs: string[] = [`[API](${this.basePath})`]

    let currentPath = ''
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (currentPath ? '/' : '') + parts[i]
      breadcrumbs.push(`[${parts[i]}](${this.basePath}/${currentPath})`)
    }

    breadcrumbs.push(parts[parts.length - 1])

    return breadcrumbs.join(' / ')
  }

  private getKindName(kind: ReflectionKind): string {
    const kindNames: Partial<Record<ReflectionKind, string>> = {
      [ReflectionKind.Class]: 'Class',
      [ReflectionKind.Interface]: 'Interface',
      [ReflectionKind.Enum]: 'Enum',
      [ReflectionKind.TypeAlias]: 'Type',
      [ReflectionKind.Function]: 'Function',
      [ReflectionKind.Variable]: 'Variable',
      [ReflectionKind.Namespace]: 'Namespace',
      [ReflectionKind.Module]: 'Module',
      [ReflectionKind.Property]: 'Property',
      [ReflectionKind.Method]: 'Method',
    }
    return kindNames[kind] || 'Unknown'
  }

  private getSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private getSourceUrl(fileName: string, line: number): string | null {
    if (!this.config.markdown?.sourceBaseUrl) return null
    const baseUrl = this.config.markdown.sourceBaseUrl.replace(/\/$/, '')
    return `${baseUrl}/${fileName}#L${line}`
  }
}

export async function generateApiDocs(
  config: TypeDocConfig,
  outputDir: string
): Promise<GeneratedApiDoc[]> {
  const generator = new TypeDocGenerator(config)
  return generator.generate(outputDir)
}
