/** Experimental documentation extraction from compiler-generated declarations. */
export type DeclarationDocsConfig = {
  /** Public entry points ending in .d.ts, .d.mts, or .d.cts. */
  entryPoints: string[]
  /**
   * Output directory inside the supplied routes directory.
   * @default "api-reference"
   */
  out?: string
  /**
   * Title of the generated index.
   * @default "API Reference"
   */
  title?: string
}

export type ApiComment = {
  description: string
  tags: Array<{ name: string; text: string }>
}

export type ApiParameter = {
  name: string
  type: string
  optional: boolean
  rest: boolean
  description: string
}

export type ApiSignature = {
  text: string
  parameters: ApiParameter[]
  returnType: string
  comment: ApiComment
}

export type ApiProperty = {
  name: string
  kind: "constructor" | "index" | "method" | "property"
  type: string
  optional: boolean
  readonly: boolean
  static: boolean
  comment: ApiComment
  signatures: ApiSignature[]
}

export type ApiDeclaration = {
  name: string
  kind: "class" | "component" | "enum" | "function" | "interface" | "type" | "variable"
  signature: string
  comment: ApiComment
  signatures: ApiSignature[]
  properties: ApiProperty[]
  propertiesComplete: boolean
  source: { file: string; line: number }
}

export type ApiExtractionDiagnostic = {
  file: string
  message: string
}

export type DeclarationProject = {
  items: ApiDeclaration[]
  diagnostics: ApiExtractionDiagnostic[]
  files: string[]
}

export type DeclarationDocsResult = {
  pages: Array<{
    path: string
    content: string
    frontmatter: { title: string; sidebar_position?: number }
  }>
} & DeclarationProject
