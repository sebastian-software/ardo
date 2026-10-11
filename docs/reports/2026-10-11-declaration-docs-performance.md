# Declaration documentation pipeline benchmark

October 11, 2026. Follow-up to the
[prototype and correctness evidence](./2026-10-11-declaration-docs-prototype.md).

Native TypeScript declaration emission followed by OXC is faster than Ardo's
current TypeDoc generator on both measured source projects. The complete
source-to-Markdown median is **643 ms versus 2,136 ms for Ardo**, a 3.32x speedup
and 69.9% less elapsed time. On the small library example it is **419 ms versus
603 ms**, a 1.44x speedup and 30.5% less time. These are local measurements of
different renderers, not a general claim about TypeDoc, equivalent output, or
the complete site's build time.

The result supports making declarations the preferred direction and testing
them as the backend for Ardo's own documentation. A universal default switch
still needs build/watch integration and a migration contract for existing
TypeDoc users. The prototype remains opt-in in this PR.

These measurements describe the initial one-pass implementation. The
[profiling and optimization follow-up](./2026-10-11-declaration-docs-optimization.md)
identifies extraction hotspots, compares compiler work directly, and records
the subsequent performance improvements with byte-identical Markdown output.

## Measured process

The [benchmark script](../../scripts/benchmark-declaration-docs.mjs) starts a fresh
Node process for every sample and times it from launch to exit after Markdown
files have been written. The native source scenarios include the CLI version
check, native process startup, type checking, declaration and declaration-map
emit, selected library discovery, OXC extraction, Markdown rendering, and disk
writes. `noEmitOnError` is enabled and comments are retained. TypeDoc uses the
actual shipped `ardo/typedoc` generator with the same source entry and project
configuration. Source links are disabled for that renderer; private, protected,
and internal members are excluded in both paths. Default TypeDoc breadcrumbs
and hierarchy rendering remain enabled.

Each mode has one discarded warmup and seven measured runs. Modes run
sequentially and their order rotates each round. OS filesystem caches are
uncontrolled: this measures fresh processes, not a cold disk. Dependency
installation, Ardo's package build, temporary config setup, output verification,
cleanup, and the subsequent Vite/HTML build are outside the measurement.
The two reuse scenarios prepare their declarations/build info before timing.
They are reported separately from generating documentation from source.

The machine is an Apple M1 Ultra, 20 logical CPUs, 64 GiB memory, macOS/Darwin
27.0.0, Node.js 24.21.0. Native emission uses TypeScript 7.0.2; TypeDoc 0.28.20
uses the workspace TypeScript 6.0.3; OXC is 0.127.0. The
[raw result](./2026-10-11-declaration-docs-performance.json) records versions,
source revision, all samples, phase timings, output counts, and output sizes.

| Scenario                                                   | Ardo median (min–max), ms | Library median (min–max), ms |
| ---------------------------------------------------------- | ------------------------: | ---------------------------: |
| Current TypeDoc generator from source                      |       2,136 (2,114–2,201) |                603 (596–785) |
| Native emit + second library scan + OXC                    |             760 (755–799) |                503 (486–527) |
| Native emit and library discovery in one project run + OXC |             643 (632–667) |                419 (407–543) |
| Native no-change incremental build + OXC                   |             484 (478–507) |                410 (402–445) |
| Existing declarations and supplied library paths + OXC     |             298 (296–308) |                272 (262–306) |

The native Ardo invocation processes a graph of **746 files**, including 61
compiler libraries, and emits 86 declarations plus 86 declaration maps. It is
one invocation for the whole project, not one invocation per source file or
export. OXC reads 27 API/dependency declaration files and those 61 libraries,
extracting 85 public exports. The library invocation processes 64 files,
including 63 default libraries, and emits one declaration and its map for 11
public exports. Compiler input graphs and files read by OXC are different
counts and are recorded separately.

| Output          | TypeDoc pages / bytes | Declaration pages / bytes |
| --------------- | --------------------: | ------------------------: |
| Ardo            |           47 / 26,929 |               86 / 70,183 |
| Library example |            14 / 8,007 |                12 / 8,555 |

TypeDoc groups some functions and types by source file; the declaration renderer
creates individual export pages. Their navigation, signatures, property tables,
and supported documentation features also differ. Page counts are not a
completeness score. Byte counts include written frontmatter and exclude the
generated-directory sentinel. The script verifies that every returned page
exists and rejects incomplete extraction or diagnostics on these profiles.
It does not replace the compiler-backed, differential, and HTML tests.

## Implemented improvement and remaining costs

The first prototype emitted declarations and then started a second project scan
with `--listFilesOnly`. The example and evaluation script now use
[`--listFiles`](https://www.typescriptlang.org/tsconfig/listFiles.html) on the emit
invocation, obtaining the selected libraries at the same time. This reduces
the full pipeline median by **15.4% for Ardo** and **16.7% for the library**
relative to the two-pass prototype, with identical declaration-path Markdown
counts and sizes. The native version guard remains included in the benchmark.

For Ardo's one-pass path, the median compiler phase is 294 ms, the explicit
version probe is 57 ms, and extraction/rendering/writing is 236 ms. TypeDoc's
module import costs 242 ms and its generation costs 1,835 ms. Phase medians do
not necessarily sum to the wall median. For the library, native compilation is
85 ms and generation is 214 ms: loading the full selected standard-library graph
and regenerating the output is now a larger cost than native emission.

Further work should reuse declarations produced by the package's regular build
and avoid duplicate documentation generation when declaration contents have not
changed. A persistent documentation process could cache parsed compiler
libraries and imported declarations, with invalidation by file content/version
and separate extraction state per project. Neither optimization is implemented
or included as an assumed speedup here.

[`incremental`](https://www.typescriptlang.org/tsconfig/incremental.html) saves
compiler state to disk. The measured native no-change build reduces Ardo's
compiler phase to 129 ms but barely changes the small example's compiler phase.
These timings do not cover changed-file rebuilds, watch-mode latency, or a
persistent compiler. The complete OXC/render/write step still runs in every
sample; incremental emit alone does not make documentation generation
incremental.

## Native API and memory

TypeScript 7.0.2 exposes experimental `typescript/unstable/sync`,
`typescript/unstable/async`, and `typescript/unstable/fs` entry points. The Node
client can keep a native Go process alive, open multiple projects, obtain
snapshots, and supply virtual files. It is a client/server API with IPC, rather
than embedding the Go checker in Node's JavaScript heap.

A local probe supplied a virtual `tsconfig.json` and this source through
`createVirtualFileSystem`, without writing either file:

```ts
export const result = { id: 1, name: "guest" }
```

`API.updateSnapshot({ openProjects: [configPath] })` followed by the project's
checker returned `{ id: number; name: string; }`, with zero semantic diagnostics.
A second snapshot reused the open project. However, the installed `Program`
has no `emit` method, and `Emitter` exposes only `printNode`; printing an AST
node is not a project-wide declaration transform with inferred types.

The requests for
[capturing declaration emit](https://github.com/microsoft/TypeScript/issues/63843)
and [general emit output](https://github.com/microsoft/TypeScript/issues/63851)
are still open as of this investigation. In-memory checking is available;
in-memory declaration emission through this published API is not. The checked
CLI-to-files pipeline is therefore the current practical implementation. Direct
checker queries could later supplement difficult mapped/conditional/indexed
types, but that would introduce an experimental protocol dependency and needs
its own correctness and performance evaluation.

## Default decision and migration work

The previously measured **96.5% normalized agreement** covers selected fields
of 452 matched member occurrences. It is not 96.5% correctness or an estimate
of all documentation needs. Known literal alternatives such as
`"light" | "dark" | string` remain visible, and a closed literal union is never
broadened to `string`. Compatibility with TypeDoc is useful evidence; useful,
accurate documentation is the acceptance criterion.

The next migration work is concrete:

- Add explicit Vite configuration for declaration entry points and an optional
  source-project compiler step. Use one checked emit per project, accept
  existing output, and define compiler errors and missing native executables.
- Connect changes in declarations and dependencies to documentation rebuilds.
  Cover a changed source/inferred signature, changed inherited JSDoc, removed
  exports, compiler failure, and cache invalidation before relying on watch mode.
- Run Ardo's own site on the new backend and verify public links/navigation,
  callable and component documentation, and the chosen policy for original
  source links. Current declaration locations are not original-source links.
- Expose presentation preferences independently of extraction, including mutable
  and readonly array styles. Preserve literals, modifiers, overloads, and type
  relationships when formatting.
- Keep an explicit TypeDoc path for projects that require its plugins, full
  TSDoc inheritance, advanced type expansion, or module resolution beyond the
  prototype's supported subset. Resolve the public dependency/migration policy
  before changing defaults for all consumers.

The new extractor already runs without importing TypeDoc or the JavaScript
TypeScript compiler, but this PR still retains TypeDoc as an Ardo dependency.
No installation-size reduction or memory reduction is claimed by these timings.

## Validation of the orchestration change

The one-pass native evaluation reproduces the committed four-profile comparison
JSON exactly, including selected library filenames, descriptions, modifiers,
type-syntax observations, and diagnostics. All 396 unit tests across 69 files
pass with coverage. All 35 integration tests across six files pass with native
TypeScript 7.0.2 selected, including the example's declaration-to-HTML build.
Repository type checking, lint, formatting, and package builds also pass; lint
retains its existing warnings. The benchmark itself completes all 70 measured
samples and ten discarded warmups and verifies every written Markdown page.

## Reproduction

With repository dependencies installed and a separately available native
TypeScript 7 executable, run from the repository root:

```sh
pnpm --filter ardo build
ARDO_DECLARATION_TSC=/path/to/typescript-7/bin/tsc node scripts/benchmark-declaration-docs.mjs /tmp/ardo-docs-performance.json
```

The script installs no packages and removes its temporary declarations, caches,
and routes. `--runs=7` and `--warmups=1` are the defaults. `--help` explains the
inputs. Local machine load and cache state affect timings; the raw ranges should
accompany any quoted speedup.
