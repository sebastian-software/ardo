// Components
export {
  ApiHierarchy,
  ApiItem,
  ApiKindBadge,
  ApiParametersTable,
  ApiReturns,
  ApiSignature,
} from "./components"

// Generator
export { generateApiDocs, TypeDocGenerator } from "./generator"

// Types
export type {
  ApiDocHierarchy,
  ApiDocItem,
  ApiDocKind,
  ApiDocParameter,
  ApiDocReturn,
  ApiDocSource,
  ApiDocTag,
  ApiDocTypeParameter,
  GeneratedApiDoc,
  TypeDocConfig,
} from "./types"

// Vite Plugin
export { createTypedocWatcher, typedocPlugin, type TypeDocPluginOptions } from "./vite-plugin"
