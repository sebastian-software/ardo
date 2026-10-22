import type { DeclarationModule } from "./declaration-project"

/** Child scopes retain physical offsets and compiler-authoritative import context. */
export function declarationScope(parent: DeclarationModule, id: string): DeclarationModule {
  return {
    id,
    file: parent.file,
    source: parent.source,
    comments: parent.comments,
    declarations: new Map(),
    globalDeclarations: new Map(),
    imports: new Map(),
    exports: new Map(),
    namespaces: new Map(),
    parent,
    stars: [],
    dependencies: parent.dependencies,
    get typeReferences() {
      return parent.typeReferences
    },
    get genericScopes() {
      return parent.genericScopes
    },
    isExternalModule: parent.isExternalModule,
    references: [],
  }
}
