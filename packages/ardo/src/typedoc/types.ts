export interface TypeDocConfig {
  /**
   * Enable TypeDoc API documentation generation
   * @default false
   */
  enabled?: boolean

  /**
   * Entry points for TypeDoc (source files or directories)
   */
  entryPoints: string[]

  /**
   * Path to tsconfig.json
   */
  tsconfig?: string

  /**
   * Output directory for generated markdown files (relative to srcDir)
   * @default 'api'
   */
  out?: string

  /**
   * Include README in the API docs
   * @default false
   */
  readme?: string | "none"

  /**
   * Plugin options passed to TypeDoc
   */
  plugin?: string[]

  /**
   * Exclude patterns
   */
  exclude?: string[]

  /**
   * Exclude external modules
   * @default true
   */
  excludeExternals?: boolean

  /**
   * Exclude private members
   * @default true
   */
  excludePrivate?: boolean

  /**
   * Exclude protected members
   * @default false
   */
  excludeProtected?: boolean

  /**
   * Exclude internal members (marked with @internal)
   * @default true
   */
  excludeInternal?: boolean

  /**
   * Sort order for members
   * @default ['source-order']
   */
  sort?: Array<
    | "source-order"
    | "alphabetical"
    | "enum-value-ascending"
    | "enum-value-descending"
    | "required-first"
    | "visibility"
  >

  /**
   * Category order for organizing API docs
   */
  categoryOrder?: string[]

  /**
   * Group order for organizing API docs
   */
  groupOrder?: string[]

  /**
   * Watch mode for development
   * @default false
   */
  watch?: boolean

  /**
   * Custom sidebar configuration for API docs
   */
  sidebar?: {
    /**
     * Title for the API section in sidebar
     * @default 'API Reference'
     */
    title?: string

    /**
     * Position in sidebar (lower = higher in list)
     * @default 100
     */
    position?: number

    /**
     * Whether the API section should be collapsed by default
     * @default false
     */
    collapsed?: boolean
  }

  /**
   * Transform options for generated markdown
   */
  markdown?: {
    /**
     * Include breadcrumbs in generated pages
     * @default true
     */
    breadcrumbs?: boolean

    /**
     * Include type hierarchy for classes/interfaces
     * @default true
     */
    hierarchy?: boolean

    /**
     * Include source links to GitHub/GitLab
     * @default true
     */
    sourceLinks?: boolean

    /**
     * Base URL for source links
     */
    sourceBaseUrl?: string

    /**
     * Use code blocks for type signatures
     * @default true
     */
    codeBlocks?: boolean
  }
}

export interface ApiDocItem {
  id: string
  name: string
  kind: ApiDocKind
  description?: string
  signature?: string
  parameters?: ApiDocParameter[]
  returns?: ApiDocReturn
  examples?: string[]
  tags?: ApiDocTag[]
  children?: ApiDocItem[]
  source?: ApiDocSource
  typeParameters?: ApiDocTypeParameter[]
  hierarchy?: ApiDocHierarchy
}

export type ApiDocKind =
  | "module"
  | "namespace"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "function"
  | "variable"
  | "property"
  | "method"
  | "accessor"
  | "constructor"
  | "parameter"
  | "typeParameter"
  | "enumMember"

export interface ApiDocParameter {
  name: string
  type: string
  description?: string
  optional?: boolean
  defaultValue?: string
}

export interface ApiDocReturn {
  type: string
  description?: string
}

export interface ApiDocTag {
  name: string
  value?: string
}

export interface ApiDocSource {
  file: string
  line: number
  url?: string
}

export interface ApiDocTypeParameter {
  name: string
  constraint?: string
  default?: string
  description?: string
}

export interface ApiDocHierarchy {
  extends?: string[]
  implements?: string[]
  extendedBy?: string[]
  implementedBy?: string[]
}

export interface GeneratedApiDoc {
  path: string
  content: string
  frontmatter: {
    title: string
    description?: string
    sidebar_position?: number
  }
}
