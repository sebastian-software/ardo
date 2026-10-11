# TypeDoc and OXC: API extraction capability assessment

Research note, October 11, 2026. Repository baseline: `c2cfd62`.
No migration decision is recorded here.

The subsequent [declaration documentation prototype](./2026-10-11-declaration-docs-prototype.md)
implements and validates the file-based path described here. This assessment
retains the initial research observations; the prototype report records the
implementation and its remaining limits.

OXC is a credible foundation for an Ardo-owned API extractor. Ardo already owns
the Markdown renderer, page structure, and component presentation. The main
replacement work is building the documentation model currently supplied by
TypeDoc. A parser alone cannot reproduce TypeScript's inferred types or
project-wide symbol relationships.

The useful distinction is between information written in the source, information
derived by the TypeScript compiler, and documentation behavior supplied by
TypeDoc. Removing TypeDoc and removing the TypeScript compiler are separate
decisions.

**Evidence and scope.** The lockfile specifies `oxc-parser 0.127.0`,
`typedoc 0.28.20`, and `typescript 6.0.3`. Their installed artifacts were inspected
and used for isolated comparison fixtures on Node.js 24.21.0. Upstream
documentation was checked on the research date; it supplements the versioned
local observations. The fixtures establish specific capabilities, not complete
output parity or an end-to-end performance improvement.
The native-compiler follow-up below additionally tests TypeScript 7.0.2 declaration
emit and the new API in `7.1.0-dev.20261010.1`, installed in a temporary directory.

**What Ardo already owns.**

- [The generator](../../packages/ardo/src/typedoc/generator.ts) bootstraps TypeDoc,
  calls `app.convert()`, and passes the resulting `ProjectReflection` to Ardo's
  renderer. It does not use TypeDoc's HTML renderer.
- [The Markdown pipeline](../../packages/ardo/src/typedoc/generator-docs.ts) and
  the surrounding page generators own page grouping, paths, indexes, navigation,
  frontmatter, and output. The generator also owns output-directory protection.
- [The MDX scope reader](../../packages/ardo/src/vite/mdx-scope.ts) uses OXC to
  parse individual ESM blocks and generated TSX, collect identifiers, and avoid
  naming collisions. It does not resolve imported declarations across files or
  extract API documentation. It currently uses the AST and errors, rather than
  OXC's separate comment and module metadata.
- [Component rendering](../../packages/ardo/src/typedoc/generator-render-component.ts)
  extracts props from inline reflections or a type found by name in the project.
  [Component classification](../../packages/ardo/src/typedoc/generator-shared.ts)
  is Ardo's uppercase-name heuristic, applied to function reflections.
- [The package manifest](../../packages/ardo/package.json) declares TypeDoc as a
  regular dependency. API generation is optional as a feature; the installed
  dependency is not currently optional. Removing it could reduce the runtime
  dependency graph, but the actual size and startup savings have not been measured.

**Capability matrix.** “Available” means exposed by the Node parser, not already
implemented as an Ardo documentation feature. The final column is an assessment
of the work needed, rather than a measured estimate.

| Information or behavior                                                 | OXC parser 0.127.0                                                     | TypeDoc with TypeScript                                                                    | Implication for Ardo                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Functions, classes, interfaces, aliases, enums, namespaces, and members | Available as AST nodes                                                 | Converted into reflection kinds and containers                                             | Straightforward extraction and normalization                                               |
| Explicit parameter, property, and return types                          | Available as TypeScript AST nodes and source spans                     | Converted into documentation types with `toString()`                                       | Preserve source syntax or build a type formatter                                           |
| Optional, readonly, static, and access modifiers                        | Available where written in the declaration                             | Normalized reflection flags                                                                | Mostly straightforward; defaults and filtering need policy                                 |
| Generic parameters, constraints, and defaults                           | Written syntax is available                                            | Structured type parameters and references                                                  | Straightforward to extract; substitution is separate                                       |
| Function overloads and declaration merging                              | Separate declarations are available                                    | Combines declarations into symbols and documented signatures                               | Group overloads, hide implementation signatures, and define merge rules                    |
| Inferred return, parameter, variable, and object types                  | Initializers and bodies are available; inferred types are not returned | Uses the TypeScript checker to derive types                                                | Major gap for a source-only parser approach                                                |
| Default values and enum values                                          | Written expressions are available                                      | Adds normalized defaults and some computed values                                          | Source display is easy; evaluating expressions is a separate capability                    |
| Import/export syntax, aliases, and type-only exports                    | AST plus `module.staticImports` and `module.staticExports`             | Produces exported declarations and reference reflections                                   | Useful raw input; OXC does not follow the target files automatically                       |
| Public API across barrel files and packages                             | Module requests and export names are available                         | Resolves symbols using the TypeScript project                                              | Build a module and symbol graph, including wildcard exports and duplicate names            |
| Path aliases, package conditions, and workspace resolution              | Not configured by `parseSync`                                          | Uses TypeScript program configuration                                                      | A separate resolver helps locate files; compatibility still needs verification             |
| Inherited members and generic base types                                | `extends`/`implements` syntax is available                             | Adds inherited members, substituted types, and reverse hierarchy information               | A major semantic gap beyond simply showing the base type's name                            |
| Utility, mapped, conditional, indexed-access, and `typeof` types        | Full written type expressions are available                            | Can derive semantic members when converting declarations; often preserves type expressions | Displaying an expression and expanding its resulting properties are different requirements |
| JSDoc/TSDoc text and tags                                               | Raw comments with spans; no attached structured JSDoc in this Node API | Associates comments with declarations, signatures, parameters, and properties              | Add comment attachment and a documentation-comment parser                                  |
| `@internal`, `@deprecated`, `@example`, categories, and groups          | Text is available inside comments                                      | Implements tag semantics, filters, and grouping                                            | Ardo must define supported tags and their effects                                          |
| `{@link ...}` and `{@inheritDoc ...}`                                   | Raw comment text                                                       | Resolves documentation references and copies inherited documentation                       | Requires symbol lookup and documentation processing, beyond tag parsing                    |
| Source locations and source links                                       | Source spans and filename input                                        | Reflection source records with file and line information                                   | Derive line numbers and preserve the declaration's origin; reuse Ardo's URL builder        |
| React props                                                             | Function/TSX syntax and written props annotations are available        | Supplies ordinary TypeScript signatures and props declarations                             | Ardo still owns component detection; expanding composed or imported props needs semantics  |
| Project errors, options, and plugins                                    | Parse errors; optional local scope-related errors                      | TypeScript diagnostics, configuration readers, converter options, and plugin hooks         | Define a new configuration and compatibility contract                                      |
| Markdown, pages, sidebar, and output guards                             | No documentation output                                                | Ardo uses its own renderer after conversion                                                | Preserve existing behavior while changing the model boundary                               |

The parser's AST, comments, and ESM metadata are documented in the
[OXC Node API](https://github.com/oxc-project/oxc/blob/main/napi/parser/README.md).
TypeDoc's compiler integration is exposed through its
[conversion context](https://typedoc.org/api/classes/Context.html), while its
[declaration model](https://typedoc.org/api/classes/DeclarationReflection.html)
contains signatures, members, hierarchy, and source records. These upstream
contracts support the separation in the matrix; the examples below were checked
against the local versions.

**Observed differences in isolated fixtures.**

| Fixture                                                                | Parser result                                                              | TypeDoc result                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `function normalize(value: string) { return value.trim() }`            | Parameter annotation is present; return annotation is absent               | Return type is `string`                                                                            |
| `function defaulted(value = "ok") { return value }`                    | Default expression is present; parameter and return annotations are absent | Parameter and return types are `string`; default value is retained                                 |
| `const settings = { size: 2, mode: "fast" } as const`                  | Object and const-assertion syntax                                          | Object type with literal-valued members                                                            |
| `class Child extends Base<string>` where `Base<T>` declares `value: T` | Child contains its own members and the base-type syntax                    | Child includes inherited `value: string`; an unannotated method returning it also returns `string` |
| `interface NarrowOptions extends Pick<Options, "required">`            | The `Pick` expression and locally declared members                         | Includes inherited `required: string`                                                              |
| `type DerivedOptions = Pick<Options, "required">`                      | The `Pick` expression                                                      | Preserves `Pick<Options, "required">`; no automatically flattened children in this fixture         |
| Two overload declarations and one implementation                       | Three separate function AST nodes                                          | One function reflection with two public signatures                                                 |
| `export { normalize as clean }` plus `export *`                        | Export names, alias, and module request                                    | Documents the declarations and adds a reference reflection for `clean`                             |
| `@param value`, `@returns`, `@example`, and `{@link Options}`          | Separate raw comment text                                                  | Parameter description, block tags, and a resolved link target                                      |
| Export annotated with `@internal`                                      | Declaration remains in the AST                                             | Removed with `excludeInternal: true`                                                               |

This confirms that TypeDoc does not indiscriminately flatten every complex type.
Any parity comparison should check the actual emitted shape rather than assume
that all utility types become property tables.

**How much of TypeDoc Ardo currently consumes.**

The current renderer uses declaration kinds, source files, child properties and
methods, signatures, type strings, selected flags, generic metadata, hierarchy,
summaries, and selected block tags. It consumes resolved semantic information even
where the presentation looks simple.

It also discards some available information:

- `renderComment()` joins comment-part text and does not use a resolved link
  target. Type references are generally displayed through `toString()`, rather
  than systematically linked.
- The page grouping is Ardo's own grouping by kind and source file. Its page
  generators do not read TypeDoc's `categories` or `groups`, even though related
  options are forwarded.
- The reflection renderer does not explicitly render getter/setter signatures or
  index signatures. Function signature text includes generic names but omits
  their constraints and defaults.
- Component detection is not semantic React analysis, and props lookup is
  limited. Replacing TypeDoc alone would not improve support for wrappers or
  complex props compositions.

Therefore, preserving Ardo's current output is a smaller task than reproducing
every TypeDoc feature. Supported configuration, plugins, and public subpaths still
make TypeDoc-specific behavior relevant to consumers.

**Evidence from Ardo's own public API.**

A read-only TypeScript symbol inventory found 85 named exports from
`packages/ardo/src/index.ts`. Of the 43 exports whose original declaration is a
function declaration, 12 have explicit return annotations and 31 rely on
inference. Many are JSX components, such as `ArdoCodeBlock` and `ArdoProvider`.
Component pages currently omit their return type, so these counts do not imply
31 visibly incomplete pages with OXC. They do show that the source is not already
fully annotated for a syntax-only extractor. Variable exports and other package
subpaths were outside that count.

Imported type semantics also occur in real public declarations:
[Hero](../../packages/ardo/src/ui/components/Hero.tsx) uses a local
`RoutePath = ComponentProps<typeof Link>["to"]` alias in `ArdoHeroAction`.
OXC can retain that spelling; determining the effective route type requires
additional information.

**Possible replacement approaches.**

| Approach                                        | What it preserves or changes                                                | Main tradeoff                                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| OXC on TypeScript source                        | Written declarations, types, comments, and exports; Ardo owns the API model | Best fit for explicitly documented syntax; inference and complex expansion need deliberate limits or another engine                         |
| OXC on existing `.d.ts` output                  | Declaration generation has already written many inferred public types       | Moves semantic work into the library build; comments, source maps, availability, freshness, and unresolved type expressions must be checked |
| Ardo extractor on the TypeScript 6 compiler API | Retains TypeScript's project, symbol, and type-checker capabilities         | Removes TypeDoc-specific machinery but retains the JavaScript compiler and requires Ardo to implement documentation semantics               |
| Ardo extractor on the new TypeScript 7.1 API    | Queries the native compiler for exports, signatures, and effective members  | Avoids rebuilding type semantics; uses a different API with a JavaScript client and a Go compiler process, currently tested in a nightly    |

The initial `.d.ts` experiments used isolated native-compiler fixtures. The
subsequent prototype also exercises the library example and Ardo's public entry
point; a complete TypeDoc replacement has not been validated. TypeScript's
[declaration output](https://www.typescriptlang.org/tsconfig/declaration.html)
represents public APIs, but declarations can still contain references and utility
type expressions. Ardo would need a contract for preserving comments and locating
original source definitions. OXC can itself emit isolated declarations through a
separate transformer API for sufficiently annotated projects; that does not add a
full checker to the parser. See
[OXC isolated declaration emit](https://oxc.rs/docs/guide/usage/transformer/isolated-declarations)
and [TypeScript's annotation requirement](https://www.typescriptlang.org/tsconfig/isolatedDeclarations.html).

There are also separate OXC components that should not be confused with the
currently used Node parser:

- [OXC resolver](https://oxc.rs/docs/guide/usage/resolver) can help locate imported
  files. That is distinct from resolving a type or assembling an exported API.
- The Rust [`oxc_semantic 0.127.0` package](https://docs.rs/crate/oxc_semantic/0.127.0)
  builds scope and symbol information and has an optional JSDoc dependency. Those
  capabilities are not all exposed by the installed `parseSync` return type.
- The [maintainer answer about Node JSDoc extraction](https://github.com/oxc-project/oxc/discussions/21507)
  recommends matching comments to nodes and using a separate comment parser.
- [Oxlint's type-aware analysis](https://oxc.rs/docs/guide/usage/linter/type-aware)
  uses a separate Go component built on `typescript-go`. Its existence does not
  establish a TypeDoc-compatible type-query API in `oxc-parser`.

**Native TypeScript follow-up: declaration emit and the new API.**

The compiler can perform the inference work before Ardo parses declarations.
TypeScript 7 is available through the regular `typescript` package and `tsc`
command. The [7.0 release announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
distinguishes the production compiler from the new compiler API planned for 7.1.
The installed 7.0.2 package also contains experimental `/unstable` API exports;
these are not the stable TypeScript 6 API.

The API status changed recently. In the [October 9 API update](https://github.com/microsoft/TypeScript/issues/64709),
Microsoft removed `/unstable` from paths such as `typescript/sync` and described
the exposed API as expected to be forward compatible, while reserving changes
before 7.1 stable. Some checker methods and documentation are still pending;
stable watch and incremental APIs are outside 7.1's scope. This makes a direct
native API worth evaluating now, rather than assuming no usable API exists.

Two isolated experiments ran with official npm packages installed outside the
repository. The first used `typescript@7.0.2` and normal strict checking, with
`declaration`, `emitDeclarationOnly`, and `declarationMap` enabled and comments
preserved. It emitted declarations and maps successfully. OXC 0.127.0 then parsed
the emitted `api.d.ts` with `lang: "dts"` and returned no parse errors.

For example, the source:

```ts
export function createUser(name = "guest") {
  return { name, id: 1, active: true }
}
```

became:

```ts
export declare function createUser(name?: string): {
  name: string
  id: number
  active: boolean
}
```

The inferred parameter and return types are available without parsing the function
body or running a JavaScript type checker. The executable default value `"guest"`
is absent, so showing that value still requires the source or a documentation tag.

The second experiment used `typescript@7.1.0-dev.20261010.1` and its
`typescript/sync` API. Its JavaScript client starts the Go compiler process.
Parsing the configuration, creating a program, and querying its checker succeeded
with no semantic diagnostics. The same fixture produced the following results:

| Public declaration                                       | Native 7.0.2 `.d.ts` output                                                     | Native 7.1 checker query                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `normalize(value: string)` with an inferred return       | Explicit `string` return                                                        | Function signature and `string` return                 |
| `createUser(name = "guest")`                             | Optional `string` parameter and object return with three typed properties       | The same inferred signature                            |
| Async `loadUser()`                                       | `Promise` of the inferred object type                                           | The same return type                                   |
| `const normalizeAgain = normalize`                       | `typeof normalize`                                                              | The resolved function signature                        |
| `class Child extends Base<string>`                       | Base reference and own `read(): string` method; inherited `value` is not copied | Both `read(): string` and inherited `value: string`    |
| `interface NarrowOptions extends Pick<Options, "label">` | `Pick` expression and own `extra` member                                        | Effective `label: string` and optional `extra` member  |
| `type SelectedOptions = Pick<Options, "label">`          | Preserved `Pick` expression                                                     | Effective `label: string` property                     |
| `type FactoryResult = ReturnType<typeof createUser>`     | Preserved `ReturnType` expression                                               | The inferred object type and its three properties      |
| String and number overloads                              | Two public declarations; implementation signature omitted                       | Two call signatures with their respective return types |
| Renamed and wildcard barrel exports                      | Re-export statements remain                                                     | Export symbols can be enumerated and aliases resolved  |

The new API also returned documentation text and `@param`/`@returns` tags for the
fixture function, including through its renamed export. Its `getDeclarationEmit`
returned both declaration files and both maps in memory, with no emit diagnostics.
These are observed capabilities of the pinned nightly, not an assertion that all
TypeDoc behavior or all old compiler API methods are available.

This establishes two different documentation contracts:

- **Declaration expressions:** Native `tsc` writes inferred public declarations;
  OXC parses their syntax into an Ardo model. References such as `Pick`, `typeof`,
  and `extends` can be presented as written. Cross-file references and barrel
  exports still require a declaration graph. Generic type relationships remain
  meaningful parts of the public API and cannot always be reduced to a fixed
  property list.
- **Effective members:** The native checker supplies the actual properties and
  signatures of composed or inherited types. This is particularly relevant to
  props tables. Querying the new API avoids asking an OXC-based extractor to
  recreate those TypeScript semantics.

Declaration emit is therefore enough to move inference to the Go compiler, but
does not serialize a completely expanded documentation graph. Comment/tag policy,
API filtering, source links, and Ardo's page model remain separate responsibilities.
The fixture retained documentation comments and `@internal`; that tag did not
automatically exclude an export. Declaration maps referred to the original source
files, but individual source-link mappings were not checked. The relevant compiler
contracts are [declaration-only emit](https://www.typescriptlang.org/tsconfig/emitDeclarationOnly.html),
[declaration maps](https://www.typescriptlang.org/tsconfig/declarationMap.html), and
[internal stripping](https://www.typescriptlang.org/tsconfig/stripInternal.html).

**Documentation comments and pragmatic coverage.**

Declaration files can carry JSDoc. In the native 7.0.2 fixture, all seven JSDoc
blocks on public declarations and members survived declaration emit, including
the function summary, `@param`, `@returns`, inline `{@link Options}`, the property
description and `@defaultValue`, and `@internal`. The configuration explicitly
set `removeComments: false`. OXC exposed their text and `start`/`end` spans in its
`comments` array, along with a separate source-map line comment. TypeScript's
[declaration output example](https://www.typescriptlang.org/tsconfig/stripInternal.html)
also demonstrates documentation comments in emitted declarations.

Ardo can attach these comments to declaration AST nodes and parse the supported
tags. Preserving a tag as text does not implement link resolution, inherited
documentation, or visibility policy. Documentation on an inherited property
remains on its base declaration in this fixture; retrieving it requires following
that reference. Existing bundled or third-party declarations must be checked for
comment preservation, since the observed compiler behavior is not a guarantee
about a different build pipeline.

A pragmatic initial target is common public signatures, available properties and
their types, required/optional status, and documentation summaries and core tags.
The original `extends` or utility-type spelling need not appear in the property
table. A target such as 95% coverage should be evaluated against representative
documentation examples; the research has not measured that percentage.

The dependency boundary can be file based: the native compiler generates
declarations as a separate build tool, and Ardo consumes those declarations with
OXC and a comment parser. This avoids a direct TypeDoc or TypeScript dependency
in that extractor. Compiler availability is still required for fresh declaration
generation. Choosing direct native API queries instead adds its client and native
compiler as extraction dependencies, so that option should be justified by the
effective-member coverage the file-based approach cannot provide cheaply.

Ardo's [compiler configuration](../../packages/ardo/tsconfig.json) currently has
`noEmit: true`, which a dedicated declaration configuration would need to override.
Its [build configuration](../../packages/ardo/tsdown.config.ts) already has
`dts: true`, but that setting alone does not establish which compiler performs
inference. This research did not switch Ardo's compiler or dependency versions.

**Experiment record.** The native fixture directory is
`/private/tmp/ardo-native-types.QygmZs`: `api.ts`, `index.ts`, `tsconfig.json`, emitted
`declarations/`, and `native-api-results.json`. The CLI was invoked as
`node node_modules/typescript/bin/tsc --project tsconfig.json`. API queries used
`parseConfigFile`, `createProgram`, `getExportsOfModule`, `getAliasedSymbol`,
`getDeclaredTypeOfSymbol`/`getTypeOfSymbol`, `getPropertiesOfType`, and
`getSignaturesOfType`. The files are temporary research evidence, not a committed
test suite or a full Ardo integration.

**Assessment and prototype follow-up.**

The follow-up experiment compares native declaration-based OXC extraction and
direct native checker queries against the subset Ardo actually renders. The
[prototype report](./2026-10-11-declaration-docs-prototype.md) records the results.
The original evaluation criteria were to use
declaration parsing for written API signatures, and evaluate the checker for
effective properties rather than implementing a second type system. Start with the library
example, an Ardo component and its props, a barrel with renamed and wildcard
exports, overloads, an inherited generic member, and a composed props type. Check
export completeness, signatures, prop names, comments, visibility, and source
origins separately. Treat unsupported semantics explicitly rather than silently
substituting an invented type.

An Ardo-owned model would make that comparison easier. The existing
[`ApiDocItem` types](../../packages/ardo/src/typedoc/types.ts) are a starting point
for review, but the Markdown path currently consumes TypeDoc reflections directly.
The existing shape also lacks an explicit overload collection and structured
symbol references. The subsequent prototype introduces a separate experimental
model and extractor under `ardo/api`; it does not replace the existing TypeDoc
integration.

Before selecting a performance strategy, measure conversion, comment processing,
rendering, cold startup, and dependency size on a representative project. A faster
parser is not evidence of a faster complete docs build; declaration generation
must be included when it is an added prerequisite.

**Initial validation limit.** The isolated OXC/TypeDoc comparison completed
successfully. At the start of the research, a normal TypeDoc conversion of Ardo's public entry point returned no
project because the configured TypeScript program reports 37 existing diagnostics:
17 missing-module diagnostics, 14 implicit-any diagnostics, and six assignment or
argument-type diagnostics. Missing modules include Ferromark, Ferriki, and the
package-level OXC link; the cached OXC parser was used directly for the fixtures.
The prototype work restored the missing links for dependencies already declared
by Ardo. Package type checking and native declaration emit then succeeded. The
initial failure therefore does not remain a blocker for the prototype. No full
TypeDoc conversion parity or performance baseline was established.
