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
} & DeclarationExtractionOptions

export type DeclarationExtractionOptions = {
  /** Declaration contents supplied by a compiler. These files need not exist on disk. */
  declarationFiles?: ReadonlyMap<string, string>
  /** Use the compiler's module resolution when extracting a source project. */
  resolveImport?: (file: string, request: string) => Promise<string | undefined>
  /**
   * Project directory used to locate installed packages when declaration output
   * is outside the project. Resolution first checks beside each declaration.
   */
  packageRoot?: string
  /**
   * Compiler lib declaration files selected by the project's compiler settings.
   * Header lib/path references are followed and global type declarations are
   * merged for inherited properties. Libraries do not become public API pages.
   */
  libFiles?: string[]
}

/** Source API documentation using the native TypeScript compiler's async API. */
export type NativeApiDocsConfig = {
  /** Source entry points, resolved relative to the current working directory. */
  entryPoints: string[]
  /** TypeScript project configuration. Ardo applies declaration options in memory. */
  tsconfig: string
  /**
   * Directory inside the routes directory.
   * @default "api-reference"
   */
  out?: string
  /**
   * Title of the generated index.
   * @default "API Reference"
   */
  title?: string
}

/** Host filesystem changes to apply to the next compiler snapshot. */
export type NativeApiFileChanges = {
  changed?: string[]
  created?: string[]
  deleted?: string[]
  invalidateAll?: boolean
}

export type NativeApiExtraction = { watchFiles: string[] } & DeclarationProject
export type NativeApiDocsResult = { watchFiles: string[] } & DeclarationDocsResult

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
