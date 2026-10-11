# Native API documentation on larger source projects

October 11, 2026. Follow-up to the [startup investigation](./2026-10-11-native-api-startup-cost.md).

The large Effect source graph shows a substantial compiler benefit: checked
declaration emission takes **626 ms with native TypeScript versus 5,670 ms with
JavaScript TypeScript**, approximately **9.1 times faster**. The complete native
API documentation process takes **1.35 seconds versus 5.93 seconds with TypeDoc**,
approximately **4.4 times faster**. Parsing, rendering, writing, and compiler
communication reduce the end-to-end gain.

The Effect timing uses a clearly labeled source variant with one explicit
internal callback return annotation. The unmodified package passes the
JavaScript compiler but fails the pinned native compiler under the recorded
settings. This experiment therefore establishes performance on the annotated
variant and exposes a compatibility difference; it does not establish a drop-in
migration for unmodified Effect.

## Inputs and measurement

The [raw benchmark](./2026-10-11-native-api-large-project-benchmark.json) records
seven fresh processes per input/mode after one discarded warmup. Mode order
rotates, and runs are sequential without concurrent benchmark jobs. Measurement
starts before Node launches and ends after Markdown writing and process exit.
Compiler startup, checked declaration generation, OXC extraction, Markdown
rendering, and session disposal are included. Installation, package building,
temporary configuration setup, verification, cleanup, and subsequent Vite/HTML
building are excluded. OS caches are uncontrolled; this is not a cold-disk test
or a warm-watch comparison.

The machine is an Apple M1 Ultra with 20 logical CPUs and 64 GiB RAM, macOS
ARM64, Node.js 24.21.0. Versions are native TypeScript
`7.1.0-dev.20261011.1`, JavaScript TypeScript `6.0.3`, TypeDoc `0.28.20`, and
OXC `0.127.0`. Implementation hashes, compiler configuration, package tarball
integrities, source hashes, individual samples, and ranges are recorded.

| Input                                       | Project source files checked | Lines including comments and blanks | Project source bytes | Native API exports / pages |
| ------------------------------------------- | ---------------------------: | ----------------------------------: | -------------------: | -------------------------: |
| Ardo public entry                           |                           86 |                              10,775 |              291,447 |                    85 / 86 |
| RxJS 7.8.2 root barrel                      |                          237 |                              19,700 |              743,230 |                  228 / 229 |
| Effect 4.0.3 `Effect.ts`, annotated variant |                          169 |                             271,313 |            8,205,769 |                  239 / 240 |

These are the transitive source graphs of the selected public entry points,
excluding dependency declarations and compiler libraries. They are not whole
repository sizes or executable-line counts. Effect's checked graph contains
about 25 times Ardo's source lines and 28 times its source bytes. The entire
published Effect source tree is larger; its namespace barrel and every other
public module are not part of this documentation target.

Published npm packages supply the original sources. The preparation script
copies them outside `node_modules`, where imported TypeScript sources would
otherwise be treated as external and omitted from declaration emission.
RxJS's legacy Node10/baseUrl settings are adapted to ESNext/Bundler resolution.
Effect uses an explicit strict NodeNext configuration with Node ambient types;
its npm package does not include the monorepo compiler configuration. The
[upstream base configuration](https://github.com/Effect-TS/effect/blob/main/tsconfig.base.json)
and [package configuration](https://github.com/Effect-TS/effect/blob/main/packages/effect/tsconfig.json)
provide the relevant settings. Every timed mode uses the same prepared source
and configuration for its input. Compiler checks remain enabled with
`noEmitOnError`; declaration comments and maps are retained.

## Complete process and compiler phase

All values below are medians from the same final cohort, in milliseconds.

| Input             | TypeDoc + TS 6 | TS 6 CLI + OXC | Direct Go CLI + OXC | Go API + OXC | TypeDoc / Go API |
| ----------------- | -------------: | -------------: | ------------------: | -----------: | ---------------: |
| Ardo              |       2,160.41 |       2,117.07 |              480.95 |       499.79 |            4.32× |
| RxJS              |       1,738.40 |       1,668.30 |              658.70 |       629.25 |            2.76× |
| Effect, annotated |       5,926.33 |       6,219.15 |            1,115.56 |     1,346.46 |            4.40× |

| Input             | TS 6 checked CLI emit | Go checked CLI emit | Compiler-phase ratio |
| ----------------- | --------------------: | ------------------: | -------------------: |
| Ardo              |              1,818.84 |              224.60 |                8.10× |
| RxJS              |              1,240.86 |              280.42 |                4.43× |
| Effect, annotated |              5,670.15 |              626.19 |                9.06× |

The compiler phase includes project startup, checking, declaration/map emission,
and library discovery. It excludes the separate version probe and OXC work.
It is not an isolated type-checker microbenchmark. Both CLI compilers write
their outputs before the same OXC pipeline runs. The API's compiler work is
inside `generateMs`, so its zero `compilerMs` does not mean free compilation.

The JavaScript CLI control helps separate compiler improvements from changing
documentation engines. Its Markdown is byte-identical to native output for
Ardo and Effect. RxJS differs by 13 bytes between compiler versions, so exact
output equality is not claimed for that control. Go API and Go CLI Markdown
paths and bytes match for every measured sample of each input. TypeDoc produces
47 / 221 / 247 pages versus native's 86 / 229 / 240; those different models are
not a feature-parity comparison.

Effect saves about **4.58 seconds per fresh run** versus TypeDoc. Ardo saves
about 1.66 seconds. Relative speedup does not grow monotonically with source
size: RxJS is larger than Ardo's source graph but has a smaller speedup. Ardo
also loads more dependency declarations: 746 compiler files versus RxJS's 332
and Effect's 356. Source bytes, public surface, dependency types, and type
complexity all affect the workload.

## Startup and work that scales

The API's median difference from the direct Go CLI is approximately +19 ms for
Ardo, −29 ms for RxJS, and +231 ms for Effect. They share the Go compiler engine
but perform different intermediate I/O and resolution work. The net difference
cannot be modeled as a fixed startup surcharge.

The [separate instrumented profiles](./2026-10-11-native-api-large-project-profile.json)
use three fresh processes per input. SDK loading medians remain about 34–36 ms. The
official collector reports the following stable counts, before final release:

| Input             | Transport requests | Source ASTs fetched | Received payload, approximately | Declaration/map files written by CLI |
| ----------------- | -----------------: | ------------------: | ------------------------------: | -----------------------------------: |
| Ardo              |                 47 |                   7 |                         0.70 MB |                                  172 |
| RxJS              |                243 |                  23 |                         1.33 MB |                                  474 |
| Effect, annotated |                 16 |                   2 |                        14.07 MB |                                  338 |

Effect's in-memory declaration response is approximately 8.68 MB; its two source
AST responses add about 5.30 MB. Ardo's corresponding responses are approximately
0.20 MB and 0.21 MB. The API writes no declarations/maps. This reveals a useful
optimization target: reduce transferred declaration and import-context data,
while retaining compiler-authoritative resolution. Fewer transport requests do
not necessarily mean less work. The pinned public `emitToString` API accepts an
emit-kind selection, without a per-file target parameter; selective emission
would require a supported upstream facility or an architectural change.

Instrumented method durations overlap, and timing collection adds overhead.
The SDK's transport-overhead estimate also includes scheduling and
serialization effects. These profiles identify work; they do not attribute the
entire 231 ms gap to IPC or establish warm-update latency.

## Compatibility and extraction findings

The [compiler comparison](./2026-10-11-native-api-large-project-compatibility.json)
checks unmodified Effect with both compilers. Native TypeScript reports TS2345
at `src/SchemaAST.ts:3109`; JavaScript TypeScript emits successfully. The
annotation adds `Effect.Effect<unknown, SchemaIssue.Issue, any>` to an internal
callback return, without changing runtime code. Its exact before/after text is
recorded in the performance input provenance. Both compilers check and emit the
annotated variant. Whether the original discrepancy is an intended TypeScript
7 change or a compiler defect remains unresolved.

RxJS's ESNext libraries exposed a separate Ardo bug: global augmentations in
module-shaped compiler libraries were rejected. Extraction now indexes
`declare global` blocks, merges their interfaces with existing globals,
preserves private helper scope and generic defaults, and keeps module helpers
out of the public global index. Regression tests cover those boundaries and
actual native ESNext iterator helpers.

The benchmark's explicit `--allow-incomplete` flag records extraction gaps
instead of hiding them or disabling compiler checks. Ardo has none. RxJS has
17 diagnostics and 18 exports marked incomplete, covering constructor
signatures and mapped/conditional type expansion. Effect has nine diagnostics
and five incomplete exports, including conditional aliases and constructor
members; namespaces `All`, `Retry`, `Repeat`, and `Effectify` are omitted.
Preserved type expressions remain available, but omitted namespaces and
unexpanded constructors are concrete follow-up work. These counts are not a
new overall completeness percentage.

Before a general default switch, the compiler discrepancy needs investigation,
and namespace/constructor cases should join the correctness fixtures. Warm
source-edit latency, long-session memory behavior, and wider platform checks
also remain separate work.

## Reproduction and validation

Build Ardo first, then prepare isolated inputs. Installation and copying occur
outside the timed boundary; package lifecycle scripts do not run.

```sh
node scripts/prepare-large-api-benchmark.mjs /tmp/ardo-large-inputs

ARDO_DECLARATION_TSC=/path/to/typescript/bin/tsc \
ARDO_DECLARATION_NATIVE_BINARY=/path/to/platform/lib/tsc \
node scripts/benchmark-declaration-docs.mjs results.json \
  --profiles=/tmp/ardo-large-inputs/profiles.json \
  --modes=typedoc,workspace-one-pass,native-binary,native-api \
  --runs=7 --warmups=1 --allow-incomplete

ARDO_DECLARATION_TSC=/path/to/typescript/bin/tsc \
node scripts/check-api-compiler-compatibility.mjs \
  /tmp/ardo-large-inputs/compatibility-profiles.json compatibility.json

# Run instrumentation separately from timing benchmarks.
node scripts/profile-native-api.mjs effect-core-annotated \
  --profiles=/tmp/ardo-large-inputs/profiles.json
```

Validation includes 413 unit tests across 72 files, 35 integration tests across
six files, workspace type checking, package building, source lint without
errors, script syntax checks, and formatting. Focused library/native/compiler
tests also pass after the final scope-handling adjustments. The same measured
Markdown fingerprints remain unchanged across the two investigation cohorts.
