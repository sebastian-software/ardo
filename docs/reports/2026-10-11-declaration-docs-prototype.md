# Declaration documentation prototype

October 11, 2026. Follow-up to the
[TypeDoc/OXC assessment](./2026-10-11-typedoc-oxc-assessment.md).

The file-based approach works through the complete documentation pipeline:
native TypeScript emits public declarations with inferred types and JSDoc, OXC
reads those declarations, and Ardo generates Markdown that its normal site build
renders as HTML. The new extractor imports neither TypeDoc nor TypeScript.

This is an experimental, opt-in path exposed as `ardo/api`. The existing TypeDoc
integration and dependency remain in place. No compiler version or lockfile was
changed, and the prototype adds no runtime dependency.

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

The extractor supports public functions, classes, interfaces, type aliases,
variables, and enums. Uppercase callable exports are treated as components using
the existing Ardo naming convention. Local interfaces and aliases can supply
their props, including inherited generic members and selected compositions:

- Intersections and local generic type arguments.
- `Pick` and `Omit` with literal property names.
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
mutability independently of their declaration order.

The output writer is shared with the TypeDoc path. It retains the generated-file
sentinel and refuses to replace a nonempty handwritten output directory. Parsing
and extraction finish before existing generated output is replaced.

## Trying the example

The library example has a separate
[`tsconfig.declarations.json`](../../examples/library/tsconfig.declarations.json)
and [`prebuild-declarations.mjs`](../../examples/library/prebuild-declarations.mjs).
The configuration preserves comments and rejects declaration emit on type errors.
The script checks that the selected compiler is TypeScript 7, emits declarations,
then generates a separate `api-declarations` route tree.

With dependencies installed and Ardo built, run from the repository root:

```sh
pnpm --filter ardo build
ARDO_DECLARATION_TSC=/path/to/typescript-7/bin/tsc node examples/library/prebuild-declarations.mjs
pnpm --dir examples/library exec react-router build
```

If native `tsc` is already on `PATH`, the environment variable can be omitted.
The workspace currently pins TypeScript 6, so its existing `tsc` should not be
used for this native-compiler experiment. The declaration and generated route
directories are ignored by Git.

Applications with existing declaration output only need the extraction step:

```ts
import { generateDeclarationDocs } from "ardo/api"

const result = await generateDeclarationDocs(
  {
    entryPoints: ["dist/index.d.ts"],
    out: "api-reference",
    title: "API Reference",
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
| Ardo public entry point                                  | 85 exports, 86 pages, 40 declaration files visited | The reader traverses Ardo's actual public declaration graph                              |
| Component property names against the native checker      | All 31 component lists match; 97 properties total  | Common Ardo component props can be enumerated accurately in this sample                  |
| Built extractor with TypeDoc/TypeScript imports rejected | Extraction and generation succeed                  | The new entry point does not load either module                                          |

The component comparison checks property **names**, not semantic equivalence of
every property type, all documentation tags, source links, or arbitrary library
APIs. It does not establish 95% coverage. Tests separately check property type
substitution, modifiers, preserved expressions, comments, overloads, re-exports,
and output protection.

The remaining expansion diagnostic on Ardo's entry point is an external
`CompileJsxOptions` base in `MarkdownConfig`. Own properties and the original
declaration remain visible. `PageFrontmatter` now includes its inherited
`[key: string]: unknown` index signature.

### TypeDoc as a differential oracle

[`typedoc-oracle.test.ts`](../../packages/ardo/src/api/typedoc-oracle.test.ts)
converts the same TypeScript source through TypeDoc and through real declaration
emit followed by OXC. The comparison checks property names, type syntax,
optionality, readonly flags, and summaries. Type syntax is compared as parsed
trees, ignoring whitespace, quote style, and outer parentheses; this is not a
proof of semantic equivalence for arbitrary types.

| Fixture group                                                     | Observed result                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Generic defaults and multiple inheritance levels                  | Property types, modifiers, and inherited comments match                                                         |
| `Partial`, `Required`, `Pick`, `Omit`, and `Readonly`             | All five interface cases match                                                                                  |
| Intersections, generic class inheritance, and getter/setter pairs | Match, including member comments and visibility filtering                                                       |
| `Readonly<Record<'open' \| 'closed', boolean>>`                   | Names and types match; the prototype preserves readonly flags that TypeDoc 0.28.20 omits                        |
| Custom mapped and conditional helpers                             | TypeDoc resolves the effective members; the prototype preserves the expression and reports incomplete expansion |
| A public `Partial<Base<string>>` alias                            | TypeDoc retains the alias without child properties; the prototype also supplies a property table                |

The ten exact matches and four explicit difference cases are assertions in the
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

All 29 declaration tests pass with native TypeScript 7.0.2. The repository unit
suite with coverage passes all 271 tests across 63 files, and all 32 integration
tests also passed during hardening;
package type checking, lint, formatting, package builds, and the library site
build passed locally. Lint retains filesystem-path heuristic warnings for the
intentional declaration and output paths. No end-to-end speed or dependency-size
benchmark was performed.

## Remaining limits and migration implications

- Package imports, tsconfig aliases, and external wildcard exports are not
  resolved. An external reference can be displayed, but its properties cannot be
  expanded by this prototype.
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
