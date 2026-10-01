import type { TOCItem } from "../config/types"
import type { ModuleNames, ModuleScope } from "./mdx-types"

import { isIdentifier } from "./mdx-ast"

export function createMetadataExports(input: {
  frontmatter: Record<string, unknown>
  handleLayout: unknown
  moduleScope: ModuleScope
  toc: TOCItem[]
}): string {
  const output: string[] = []
  appendMetadataExport({
    name: "frontmatter",
    scope: input.moduleScope,
    value: input.frontmatter,
    output,
  })
  appendMetadataExport({ name: "toc", scope: input.moduleScope, value: input.toc, output })
  appendHandleExport(input.handleLayout, input.moduleScope, output)
  return output.join("\n")
}

export function createContentFunction(input: {
  authoredComponents: string[]
  generatedElements: string[]
  moduleScope: ModuleScope
  names: ModuleNames
}): { beforeBody: string; afterBody: string } {
  const intrinsicComponents = input.generatedElements
    .map((name) => `  ${JSON.stringify(name)}: ${JSON.stringify(name)},`)
    .join("\n")
  const aliases = input.authoredComponents
    .filter(
      (name) =>
        name !== "props" &&
        name !== input.names.components &&
        name !== input.names.mermaid &&
        isIdentifier(name) &&
        !input.moduleScope.bindings.has(name)
    )
    .map((name) => `  const ${name} = ${input.names.components}[${JSON.stringify(name)}];`)
    .join("\n")
  const beforeBody =
    `\nfunction ${input.names.content}(props = {}) {\n` +
    `  const ${input.names.components} = {\n${
      intrinsicComponents === "" ? "" : `${intrinsicComponents}\n`
    }    ...${input.names.useComponents}(),\n` +
    `    ...props.components,\n` +
    `  };\n${input.generatedElements
      .map(
        (name) =>
          `  ${input.names.components}[${JSON.stringify(name)}] ??= ${JSON.stringify(name)};`
      )
      .join("\n")}${input.generatedElements.length === 0 ? "" : "\n"}${
      aliases === "" ? "" : `${aliases}\n`
    }  return <${input.names.components}.wrapper {...props}>\n    `
  const afterBody = `\n  </${input.names.components}.wrapper>;\n}\n`
  return { afterBody, beforeBody }
}

export function createRouteFunction(input: {
  authoredLayout?: string
  content: string
  frontmatter: string
  frontmatterExpression: string
  frontmatterValue: string | undefined
  names: ModuleNames
  toc: string
  tocValue: string | undefined
}): string {
  const frontmatterValue = input.frontmatterValue ?? "{}"
  const layoutContent =
    input.authoredLayout == null
      ? `<${input.content} {...props} />`
      : `<${input.authoredLayout} {...props}><${input.content} {...props} /></${input.authoredLayout}>`
  return (
    `\nconst ${input.frontmatter} = ${frontmatterValue};\n` +
    `const ${input.toc} = ${input.tocValue ?? "[]"};\n` +
    `function ${input.names.route}(props = {}) {\n` +
    `  return <${input.names.pageDataProvider} frontmatter={${input.frontmatterExpression}} toc={${input.toc}}>${layoutContent}</${input.names.pageDataProvider}>;\n` +
    `}\n` +
    `export default ${input.names.route};\n`
  )
}

function appendMetadataExport(input: {
  name: "frontmatter" | "toc"
  output: string[]
  scope: ModuleScope
  value: unknown
}): void {
  if (input.scope.exportedNames.has(input.name)) return
  if (input.scope.bindings.has(input.name)) {
    input.output.push(`export { ${input.name} };`)
    return
  }
  input.output.push(`export const ${input.name} = ${JSON.stringify(input.value)};`)
}

function appendHandleExport(layout: unknown, scope: ModuleScope, output: string[]): void {
  if ((layout !== "bare" && layout !== "default") || scope.exportedNames.has("handle")) return
  if (scope.bindings.has("handle")) {
    output.push("export { handle };")
    return
  }
  output.push(`export const handle = ${JSON.stringify({ layout })};`)
}
