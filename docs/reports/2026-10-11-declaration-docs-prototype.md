# Declaration documentation prototype

October 11, 2026. Follow-up to the
[TypeDoc/OXC assessment](./2026-10-11-typedoc-oxc-assessment.md).

The file-based approach works through the complete documentation pipeline:
native TypeScript emits public declarations with inferred types and JSDoc, OXC
reads those declarations, and Ardo generates Markdown that its normal site build
renders as HTML. The new extractor imports neither TypeDoc nor TypeScript.

This is an experimental, opt-in path exposed as `ardo/api`. The existing TypeDoc
integration and dependency remain in place, and the workspace compiler version
is unchanged. OXC is an optional peer dependency for this entry point and a
development dependency for its tests; applications using declaration extraction
must install it. The prototype adds no mandatory runtime dependency to Ardo.

The initial research used baseline `c2cfd62`, where MDX compilation already used
OXC. Main subsequently moved that work into Ferromark and removed the direct OXC
dependency. The prototype keeps OXC available explicitly for API extraction
without restoring the previous MDX implementation.

## Boundary and implementation

```text
TypeScript source + JSDoc
  -> native tsc (separate build tool)
  -> .d.ts files with inferred public signatures and retained comments
  -> OXC + Ardo declaration model
  -> Markdown routes
  -> normal Ardo site build
```

[`extractDeclarations`](../../packages/ardo/src/api/extractor.ts) reads one or
more declaration entry points and returns public items, diagnostics, and the
files visited. [`generateDeclarationDocs`](../../packages/ardo/src/api/generator.ts)
also renders and writes the pages. Both consume existing declaration files;
neither runs or installs a compiler.

The model retains declaration text, structured call signatures, parameters,
properties, documentation comments, and declaration locations. The reader follows
relative imports and exports, including `.js` specifiers pointing to `.d.ts`
files, aliases, type-only exports, wildcard exports, and cyclic barrels. Internal
helpers remain available for resolving public types without becoming API pages.
Installed package declarations can also supply inherited properties and utility
inputs. Imports are loaded when export resolution or member expansion needs
them; a leaf property keeps its type expression without loading that dependency's
entire declaration graph.

The extractor supports public functions, classes, interfaces, type aliases,
variables, and enums. Uppercase callable exports are treated as components using
the existing Ardo naming convention. Local and imported interfaces and aliases can supply
their props, including inherited generic members and selected compositions:

- Intersections and local generic type arguments.
- `Pick` and `Omit` with literal property names, including local aliases and
  bound generic key parameters. `never` produces an empty key set.
- `Partial`, `Required`, and `Readonly`.
- `Record` with finite literal keys or primitive dictionary keys, and interface
  and class index signatures.
- `typeof` function aliases and `ReturnType` of a resolvable concrete function.

This is bounded syntax processing, with explicit diagnostics for unsupported
expansion. It is not a second TypeScript checker. Type expressions remain visible
even when their effective properties cannot be enumerated.

JSDoc is attached using the comment spans returned by OXC. The rendered subset
includes summaries, `@param`, `@returns`/`@return`, `@remarks`, `@example`,
`@deprecated`, `@default`/`@defaultValue`, and local `{@link ...}` references.
`@internal` declarations and private/protected class members are excluded.
Inherited property descriptions are obtained from the referenced declaration.
Getter/setter pairs share one property, retain getter documentation, and report
mutability independently of their declaration order. Lint comments between JSDoc
and a declaration do not hide its documentation. Overloaded methods retain the
first available member description and each signature's own parameter comments.
Readonly class fields whose declarations retain literal initializers are
documented with their literal type, including strings, booleans, numbers, and
bigints.

### Installed package bases

[`package-declarations.ts`](../../packages/ardo/src/api/package-declarations.ts)
locates declarations through ancestor `node_modules` directories, including
scoped packages and symlinked package dependencies. It reads `exports` with
ordinary `types`, `node`, `import`, and `default` conditions; `.d.cts` selects
`require` instead of `import`. Exact and wildcard subpaths, nested conditions,
and blocked exports are handled. Packages without `exports` can use `types`,
`typings`, declaration siblings of `main`, or an index declaration. Package
JavaScript is never imported or executed. The supported subset follows the
[TypeScript package-resolution reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports).

For declaration output outside its project, pass the source project's directory
as `packageRoot` to `extractDeclarations(entryPoints, { packageRoot })` or in the
configuration for `generateDeclarationDocs`. Lookup beside the declaration
takes precedence, so a package's own installed dependency is preserved.
Dependency-only helpers supply property tables without becoming public API
pages unless the entry point explicitly re-exports them.

This resolver does not consume tsconfig settings. `.d.ts` imports use the ESM
condition set, and custom conditions, `typesVersions`, versioned `types@...`
exports, `@types` fallback packages, package self-references/`imports`, and
ambient package declarations are outside this resolver. Version-dependent
branches and unavailable or blocked package declarations leave expansion
incomplete rather than silently choosing an unrelated fallback. These limits
are covered by explicit diagnostics at the expansion/export boundary.

### Compiler library bases

Pass the project's selected compiler declaration libraries as `libFiles` to
either extraction function. The reader follows header `reference lib` and
`reference path` directives, stops cycles, and merges top-level global interfaces
across files. Each fragment retains its source context, generic bindings, JSDoc,
and method overloads. For example, ES5 supplies `Error.name`, `message`, and
`stack`, while ES2022 adds `cause`. Constructor variables such as `declare var
Error` are excluded from instance inheritance. Local and imported type names
retain precedence, and the supported built-in utility types keep their bounded
expansion. Library declarations do not become public API pages.

The example and evaluation script use the selected compiler's `--listFilesOnly`
output to find its physical library directory and the files selected by the
project configuration. This also works with TypeScript 7's platform package;
its libraries are not beside the JavaScript CLI shim. An unrelated package's
`lib.d.ts` must not be mistaken for a compiler library. The oracle fixture and
the real Ardo comparison cover that boundary. Explicitly supplied missing,
invalid, or module-scoped library files fail before generated output is replaced.

Header references follow the
[TypeScript triple-slash directive conventions](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html).
No default library is guessed or loaded implicitly. Namespace members, ambient
module/global augmentation blocks, library replacement packages, `reference
types` packages, and global value queries remain outside this subset. Unsupported
ambient package references produce a diagnostic. The extractor still only reads
files; it does not import a compiler or consume tsconfig itself.

The output writer is shared with the TypeDoc path. It retains the generated-file
sentinel and refuses to replace a nonempty handwritten output directory. Parsing
and extraction finish before existing generated output is replaced.

## Trying the example

The library example has a separate
[`tsconfig.declarations.json`](../../examples/library/tsconfig.declarations.json)
and [`prebuild-declarations.mjs`](../../examples/library/prebuild-declarations.mjs).
The configuration preserves comments and rejects declaration emit on type errors.
The script checks that the selected compiler is TypeScript 7, emits declarations,
collects its selected library files, then generates a separate `api-declarations`
route tree.

The repository development dependencies include OXC. With dependencies installed
and Ardo built, run from the repository root:

```sh
pnpm --filter ardo build
ARDO_DECLARATION_TSC=/path/to/typescript-7/bin/tsc node examples/library/prebuild-declarations.mjs
pnpm --dir examples/library exec react-router build
```

If native `tsc` is already on `PATH`, the environment variable can be omitted.
The workspace currently pins TypeScript 6, so its existing `tsc` should not be
used for this native-compiler experiment. The declaration and generated route
directories are ignored by Git.

Applications with existing declaration output need the optional parser and the
extraction step:

```sh
pnpm add -D oxc-parser@^0.127.0
```

```ts
import { generateDeclarationDocs } from "ardo/api"

const result = await generateDeclarationDocs(
  {
    entryPoints: ["dist/index.d.ts"],
    out: "api-reference",
    title: "API Reference",
    libFiles: ["/path/to/compiler-libs/lib.es2022.d.ts"],
  },
  "app/routes"
)

for (const diagnostic of result.diagnostics) {
  console.warn(diagnostic.file, diagnostic.message)
}
```

Entry points must end in `.d.ts`, `.d.mts`, or `.d.cts`. The output must be a child
of the supplied routes directory. `propertiesComplete` describes whether the
requested member expansion succeeded; it is not a measure of documentation
quality or overall type-system coverage. A union alias is documented by its
alternatives, while requesting a flat props table from that union reports a limit.

## Observed results

The native emission experiments used official `typescript@7.0.2` outside the
repository. OXC was the workspace's existing `0.127.0`. The checker comparison
used `typescript@7.1.0-dev.20261010.1` as a test reference, separately from Ardo.

| Check                                                    | Result                                             | What it establishes                                                                      |
| -------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Library native declaration emit and extraction           | 5 exports, 6 pages, no extraction diagnostics      | Functions, an options interface, and a class retain types and documentation              |
| Library production site build                            | All 6 new pages prerendered as HTML                | The generated Markdown works with Ardo's routing, Markdown compilation, and prerendering |
| Native declaration emit for Ardo                         | Succeeded with type checking and `noEmitOnError`   | The experiment uses real inferred declarations rather than unchecked source syntax       |
| Ardo public entry point                                  | 85 exports; 27 API files and 61 compiler lib files | The reader loads public declarations and required bases, including Ferromark and globals |
| Component property names against the native checker      | All 31 component lists match; 97 properties total  | Common Ardo component props can be enumerated accurately in this sample                  |
| Built extractor with TypeDoc/TypeScript imports rejected | Extraction and generation succeed                  | The new entry point does not load either module                                          |

The component comparison checks property **names**, not semantic equivalence of
every property type, all documentation tags, source links, or arbitrary library
APIs. It does not establish 95% coverage. Tests separately check property type
substitution, modifiers, preserved expressions, comments, overloads, re-exports,
and output protection.

Ardo's entry point now has no expansion diagnostics. `MarkdownConfig` contains
all 33 properties: four Ardo fields and 29 options inherited through
`Pick<CompileJsxOptions, ...>`. The package-boundary test also renders those
options to Markdown and checks an inherited description. `PageFrontmatter`
includes its inherited `[key: string]: unknown` index signature.

### TypeDoc as a differential oracle

[`typedoc-oracle.test.ts`](../../packages/ardo/src/api/typedoc-oracle.test.ts)
converts the same TypeScript source through TypeDoc and through real declaration
emit followed by OXC. The comparison checks property names, type syntax,
optionality, readonly flags, and summaries. Type syntax is compared as parsed
trees, ignoring whitespace, quote style, and outer parentheses; this is not a
proof of semantic equivalence for arbitrary types.

| Fixture group                                                       | Observed result                                                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Generic defaults, identity aliases, and multiple inheritance levels | Property types, modifiers, and inherited comments match                                                         |
| `Partial`, `Required`, `Pick`, `Omit`, and `Readonly`               | All five interface cases match                                                                                  |
| Aliased/generic keys and `never` in `Pick`, `Omit`, and `Record`    | All six cases match, including empty property sets and generic value substitution                               |
| Intersections, generic class inheritance, and getter/setter pairs   | Match, including member comments and visibility filtering                                                       |
| External generic bases, namespace imports, and class inheritance    | Names, types, modifiers, and comments match across real package declaration boundaries                          |
| Standard `Error`/`TypeError` inheritance and selected error options | All three cases match after loading and merging the compiler's selected libraries                               |
| External subpath base with inline member JSDoc                      | Names, types, and modifiers match; the prototype retains one inherited description TypeDoc omits                |
| `Readonly<Record<'open' \| 'closed', boolean>>`                     | Names and types match; the prototype preserves readonly flags that TypeDoc 0.28.20 omits                        |
| Custom mapped and conditional helpers                               | TypeDoc resolves the effective members; the prototype preserves the expression and reports incomplete expansion |
| A public `Partial<Base<string>>` alias                              | TypeDoc retains the alias without child properties; the prototype also supplies a property table                |

The twenty-three exact matches and five explicit difference cases are assertions in the
test suite. The readonly difference is checked against the compiler with a
`@ts-expect-error` assignment: declaration emission fails if the compiler stops
rejecting writes. TypeDoc serves as a comparison tool, not an assumption that
every detail in its reflection model is correct or required for documentation.

[`declaration-emit.test.ts`](../../packages/ardo/src/api/declaration-emit.test.ts)
also checks inferred default parameters, object and async returns, callable
aliases, overloads, inherited props, JSDoc tags, and internal filtering from
freshly compiled source. Comments must actually survive declaration emission;
the extractor cannot recover comments the compiler omitted. Both compiler-backed
tests use the workspace compiler by default. `ARDO_DECLARATION_TSC` selects another
CLI, and CI runs all declaration tests again with isolated `typescript@7.0.2` on
Node.js 24 without changing the workspace compiler or production dependencies.

All 75 declaration tests pass with native TypeScript 7.0.2. The repository unit
suite with coverage passes all 339 tests across 67 files, and all 32 integration
tests also passed during hardening;
package type checking, lint, formatting, package builds, and the library site
build passed locally. Lint retains filesystem-path heuristic warnings for the
intentional declaration and output paths. No end-to-end speed or dependency-size
benchmark was performed.

### Comparing real public APIs

[`evaluate-declaration-docs.mjs`](../../scripts/evaluate-declaration-docs.mjs)
repeats the comparison on Ardo, the library example, and the installed registry
declarations of Ferromark and Ferriki. Ardo and the example are freshly compiled
with type checking and retained comments; the two dependency declarations are
read directly. TypeDoc uses the workspace JavaScript compiler as the independent
oracle. Neither compiler is imported by the production extractor.

With Ardo built, reproduce the native run with:

```sh
ARDO_DECLARATION_TSC=/path/to/typescript-7/bin/tsc node scripts/evaluate-declaration-docs.mjs /tmp/ardo-api-comparison.json
```

Omit the environment variable to compare using the workspace compiler. The
script installs no packages, removes its temporary declaration output, and
reports both compiler versions and the selected compiler library filenames.
An extraction or compiler failure fails the
command; observed differences remain report data, not a percentage or CI gate.

The [recorded native result](./2026-10-11-declaration-api-comparison.json) uses
TypeScript 7.0.2 for emission and TypeDoc 0.28.20 with TypeScript 6.0.3 for the
oracle:

| Public API             | Extracted exports | Compared member occurrences | Remaining observations                                                         |
| ---------------------- | ----------------- | --------------------------- | ------------------------------------------------------------------------------ |
| Ardo                   | 85                | 201                         | Four type-spelling differences; no expansion diagnostics                       |
| Library example        | 5                 | 8                           | No differences in the compared fields                                          |
| Ferromark 3.4.0        | 32                | 97                          | Ten type-spelling differences; callback alias lacks a structured signature     |
| `@ferriki/core` 0.13.0 | 43                | 142                         | Type spelling, callable aliases, and a symbol member; both error classes match |

The 448 compared member occurrences include repeated props declarations and
their component uses. The comparison covers available property/method names,
optional/readonly flags, descriptions, property type syntax, and signature
counts. It does not compare index signatures, constructors, every call parameter
and return type, all tags, source links, or fully expanded semantics. Tables
without a corresponding TypeDoc member owner are listed separately: Ardo has 16
and Ferromark has eight. Some refer to local unexported props or utility aliases
whose type expression TypeDoc retains without an available member table.
Ferromark's additional TypeDoc declaration, `JsxRenderOptionKey`, is a local
unexported helper rather than a missing public export.

The real inputs exposed four problems that now have reproducing regression
tests and fixes:

- Ferromark places lint comments between JSDoc and several exports. Searching
  only the immediately preceding comment lost four export descriptions.
- Ferromark's preparation/render options use a local union alias inside `Pick`
  and `Omit`. Resolving finite key aliases removes both expansion diagnostics and
  supplies those property tables. Compiler-backed cases also cover generic keys,
  generic identity aliases, defaults, and empty key sets.
- `JsxCompiler.compile` documents its first overload. Merging a later
  undocumented overload discarded the method description; the merged member
  now retains it while preserving all signatures.
- Ferriki's `ShikiError` and `FerrikiError` inherit global fields that are absent
  from the package's declarations. Reading and merging ES5/ES2022 libraries adds
  all four inherited fields to each class. Both classes now match TypeDoc on
  every field this comparison checks, with no expansion diagnostics.

Ardo's four remaining type-spelling differences are `Array<T>` versus `T[]` and
object member order. Ferriki also shows union order, an indexed-access expression
versus its expanded type, and the original `"dark" | "light" | string` versus
TypeDoc's simplified `string`. The extractor preserves rest parameters and a
nested readonly modifier that TypeDoc's printed property types omit. This is
another reason to inspect oracle differences rather than treating them all as
extractor defects.

The package-base increment adds all 29 selected Ferromark fields to
`MarkdownConfig` without introducing a runtime dependency. That additional table
is recorded separately because TypeDoc retains the public intersection alias
without a corresponding flat member owner. Only members with a corresponding
oracle entry contribute to the compared-member count.

The external class fixture exposed a separate declaration-emission detail:
literal readonly field initializers can remain without a type annotation.
Extracting their literal types now matches both compiler outputs and TypeDoc.
Package fixtures also cover lazy imports, defaults and overrides, ESM/CommonJS
conditions, scoped subpaths, blocked exports, private declarations, cyclic
barrels, nested dependency versions, and out-of-tree emission.

The compiler-library increment removes the two missing-member observations and
both incomplete tables in Ferriki. All four real API profiles now have no
extraction diagnostics. Structured callable type aliases, such as Ferromark's
`JsxCodeRenderer`, remain a smaller follow-up: their full
type text is already present, but dedicated parameter/return sections are absent.

## Remaining limits and migration implications

- Package declaration imports and external wildcard exports now resolve within
  the supported package lookup subset described above. Top-level global bases
  resolve when compiler libraries are explicitly supplied. Namespaced or
  module-based global augmentations, tsconfig aliases, custom/versioned package
  resolution, and `@types` fallback packages still need additional context.
- Conditional, mapped, indexed-access, and union types retain their expressions.
  They do not become a synthesized flat property table. Utility transformations
  such as `Partial` or `Pick` over open index signatures report a limit rather
  than inventing effective dictionary types. Unsupported declaration forms such
  as namespaces/CommonJS exports also emit diagnostics.
- Default expressions disappear during declaration emit. Displaying them needs
  `@defaultValue` or a separate source lookup. Enum expressions that remain in a
  declaration are preserved as written.
- Source locations currently refer to declarations. Declaration-map lookup and
  original repository source links are not implemented.
- Component detection remains a naming heuristic. React wrappers and callable
  object types require further evaluation.
- TypeDoc plugin compatibility, categories/groups, `@inheritDoc`, and full TSDoc
  semantics are outside this prototype.

The useful next evaluation is a representative set of consumer APIs with these
limits classified by their impact on the rendered documentation. Expanding
external props or intricate utility types may justify targeted native checker
queries; it should not require rebuilding broad TypeScript semantics in Ardo.
Removing the existing TypeDoc dependency is a later migration step after that
coverage and the public configuration contract are agreed.
