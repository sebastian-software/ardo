import MagicString from "magic-string"

import type { AuthoredLayout, GeneratedModuleInput, ModuleNames } from "./mdx-types"

import { buildToc } from "../markdown/toc"
import { createContentFunction, createMetadataExports, createRouteFunction } from "./mdx-codegen"
import { preserveEsmAndFindLayout, removeMarkdownOutsideEsm } from "./mdx-layout"
import { createModuleSourceMap } from "./mdx-sourcemap"

export function createMdxModule(input: GeneratedModuleInput): {
  code: string
  map: ReturnType<typeof createModuleSourceMap>
} {
  const sourceBytes = Buffer.from(input.source, "utf8")
  const magic = new MagicString(input.source, { filename: input.id })
  const layout = preserveEsmAndFindLayout({
    blocks: input.moduleScope.blocks,
    magic,
    names: input.names,
    sourceBytes,
  })
  removeMarkdownOutsideEsm({
    blocks: input.moduleScope.blocks,
    magic,
    source: input.source,
    sourceBytes,
  })

  magic.prepend(createModuleImports(input.names, input.result.codeBlocks))
  const sections = createModuleSections(input, layout)
  const bodyStartOffset = appendGeneratedModule(magic, input, sections)
  const code = magic.toString()
  const map = createModuleSourceMap({
    bodyStartOffset,
    generatedCode: code,
    id: input.id,
    magic,
    nativeMappings: input.result.mappings,
  })
  return { code, map }
}

function createModuleImports(
  names: ModuleNames,
  codeBlocks: GeneratedModuleInput["result"]["codeBlocks"]
): string {
  const mermaidImport = codeBlocks.some((block) => block.language?.toLowerCase() === "mermaid")
    ? `import { ArdoMermaid as ${names.mermaid} } from "ardo/ui";\n`
    : ""
  return (
    `import { useMDXComponents as ${names.useComponents} } from "ardo/mdx-provider";\n` +
    `import { ArdoPageDataProvider as ${names.pageDataProvider} } from "ardo/runtime";\n${
      mermaidImport
    }`
  )
}

function createModuleSections(input: GeneratedModuleInput, layout: AuthoredLayout): ModuleSections {
  const toc = buildToc(input.metadata.headings, input.markdownConfig?.toc?.level ?? [2, 3])
  const dataExports = createMetadataExports({
    frontmatter: input.metadata.frontmatter,
    handleLayout: input.metadata.frontmatter.layout,
    moduleScope: input.moduleScope,
    toc,
  })
  const layoutPrelude = createLayoutPrelude(layout, input.names)
  const content = createContentFunction({
    authoredComponents: input.result.components,
    generatedElements: input.result.elements,
    moduleScope: input.moduleScope,
    names: input.names,
  })
  const authoredLayout = hasAuthoredLayout(layout) ? input.names.authoredLayout : undefined
  const route = createRouteFunction({
    authoredLayout,
    content: input.names.content,
    frontmatter: input.names.frontmatter,
    frontmatterExpression: input.moduleScope.bindings.has("frontmatter")
      ? "frontmatter"
      : input.names.frontmatter,
    frontmatterValue: JSON.stringify(input.metadata.frontmatter),
    names: input.names,
    toc: input.names.toc,
    tocValue: JSON.stringify(toc),
  })
  return { content, dataExports, layoutPrelude, route }
}

function createLayoutPrelude(layout: AuthoredLayout, names: ModuleNames): string[] {
  return [
    ...(layout.importStatement == null ? [] : [layout.importStatement]),
    ...(layout.expression == null || layout.expression === names.authoredLayout
      ? []
      : [`const ${names.authoredLayout} = ${layout.expression};`]),
    ...(layout.localBinding == null
      ? []
      : [`const ${names.authoredLayout} = ${layout.localBinding};`]),
  ]
}

function appendGeneratedModule(
  magic: MagicString,
  input: GeneratedModuleInput,
  sections: ModuleSections
): number {
  magic.append(`\n${sections.layoutPrelude.join("\n")}\n${sections.dataExports}\n`)
  magic.append(sections.content.beforeBody)
  const bodyStartOffset = magic.toString().length
  magic.append(input.result.body)
  magic.append(sections.content.afterBody)
  magic.append(sections.route)
  return bodyStartOffset
}

function hasAuthoredLayout(layout: AuthoredLayout): boolean {
  return layout.localBinding != null || layout.expression != null || layout.importStatement != null
}

type ModuleSections = {
  content: ReturnType<typeof createContentFunction>
  dataExports: string
  layoutPrelude: string[]
  route: string
}
