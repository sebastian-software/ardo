export { extractDeclarations } from "./extractor"
export { generateDeclarationDocs } from "./generator"
export { generateNativeDocs, NativeApiProject, NativeCompilerError } from "./native-project"
export type {
  ApiComment,
  ApiDeclaration,
  ApiExtractionDiagnostic,
  ApiParameter,
  ApiProperty,
  ApiSignature,
  DeclarationDocsConfig,
  DeclarationDocsResult,
  DeclarationExtractionOptions,
  DeclarationProject,
  NativeApiDocsConfig,
  NativeApiDocsResult,
  NativeApiExtraction,
  NativeApiFileChanges,
} from "./types"
