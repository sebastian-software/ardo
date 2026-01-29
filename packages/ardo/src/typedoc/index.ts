// Types
export type {
  TypeDocConfig,
  ApiDocItem,
  ApiDocKind,
  ApiDocParameter,
  ApiDocReturn,
  ApiDocTag,
  ApiDocSource,
  ApiDocTypeParameter,
  ApiDocHierarchy,
  GeneratedApiDoc,
} from "./types"

// Generator
export { TypeDocGenerator, generateApiDocs } from "./generator"

// Vite Plugin
export { typedocPlugin, createTypedocWatcher, type TypeDocPluginOptions } from "./vite-plugin"

// Components
export {
  ApiSignature,
  ApiParametersTable,
  ApiReturns,
  ApiItem,
  ApiKindBadge,
  ApiHierarchy,
} from "./components"
