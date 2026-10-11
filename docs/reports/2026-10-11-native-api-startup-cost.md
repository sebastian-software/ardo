# Native API startup cost and module resolution

October 11, 2026. Follow-up to the [API integration](./2026-10-11-native-api-integration.md).

The original comparison measured a fresh Node process and a fresh Go process
for every run. It did not compare an already-running API session with a newly
started CLI. The API's cold-start overhead cannot be attributed to RPC alone:
the Node SDK must load, the server must initialize, and the adapter requests
compiler metadata and import resolution that the CLI declaration reader handles
without that server.

## Measured work

The [instrumented profile](./2026-10-11-native-api-startup-profile.json) runs
three fresh processes per project and adapter variant. Loading the official
JavaScript SDK alone has medians of 32.5–34.5 ms across the four combinations.
The direct native CLI does not load that SDK. These timings are additional to
loading Ardo/OXC, starting the native server, and checking the source project.
The SDK import is cached within a running Node process; subsequent session
updates do not pay it again.

For Ardo, the baseline issues 667 logical metadata queries, fetches seven source
ASTs, and makes 56 import-mode plus 56 module-target queries. The SDK batches
these operations: this is **73 transport requests**, not hundreds of separate
round trips. The library example fetches no ASTs, performs no module-resolution
queries, and needs only seven transport requests. Its 63 library metadata
queries are sent in one batch.

The source ASTs preserve exact import context, including explicit
`resolution-mode` attributes. They are not a second type checker. The direct
CLI baseline instead uses the bounded filesystem declaration resolver; the two
paths produce identical Markdown for these inputs but do different intermediate
work. Its Ardo declaration/map output is only about 155 KB across 172 files.
Removing that output does not remove SDK loading or initialization costs.

SDK timing totals include scheduling, startup, serialization, and transport in
their round-trip measurements. Their `transportOverheadMs` estimate is not an
isolated measurement of IPC cost. Per-method wrapper durations overlap for
batched calls and must not be summed into a wall-clock total. Instrumentation
adds overhead; these profiles diagnose work rather than establish speedup.

## Adapter improvement and paired comparison

The adapter now calls `program.getResolvedModuleFromModuleSpecifier` directly.
The compiler selects the mode for the original import node and returns its
resolved target in one operation. The previous adapter obtained the mode first,
then called `getResolvedModule`. The new operation retains the existing
ambiguity diagnostic when the same request resolves to different declarations.
The AST type guard loads lazily, preserving the optional native SDK dependency.

Ardo's transport request count falls from **73 to 47** in all three diagnostic
samples. It still fetches the same seven ASTs. The library does not use import
resolution and stays at seven requests.

The [paired benchmark](./2026-10-11-native-api-startup-benchmark.json) uses seven
measured fresh processes per project/mode after one discarded warmup, rotating
mode order. All modes use the same pinned TypeScript 7.1 nightly. The baseline
is the built adapter from commit `bf22d1d`; both implementation chunk hashes
are recorded. Compilation, extraction, Markdown writing, startup, and process
exit are included. Vite/HTML building is excluded and OS caches are uncontrolled.

| Input   | Previous API, median (min–max) | Direct-specifier API, median (min–max) | Direct native CLI, median (min–max) |
| ------- | -----------------------------: | -------------------------------------: | ----------------------------------: |
| Ardo    |      486.68 ms (479.31–494.63) |              478.70 ms (471.94–490.67) |           457.85 ms (452.25–469.82) |
| Library |      268.97 ms (266.22–274.50) |              268.22 ms (267.41–272.36) |           233.29 ms (228.41–235.12) |

The changed Ardo median is about 8 ms lower, with overlapping ranges. The
library difference is under 1 ms and is not evidence of a speedup. All 48
warmup/measured samples produce identical Markdown paths and bytes for their
input. The API writes zero declarations/maps.

The revised API remains approximately 21 ms slower than the direct CLI for
Ardo and 35 ms slower for the library in this run. SDK startup contributes to
that difference, while compiler emission, file I/O, transport, and adapter work
also differ. This does not assign the entire net difference to one cause or
establish a universal percentage. The earlier run's 520/472 ms comparison is
retained as historical evidence rather than subtracting timings across runs.

## Validation and reproduction

The existing compiler-backed tests retain aliases, package conditions, NodeNext
format changes, explicit import modes, and mixed-mode diagnostics. Repository
unit tests, integration tests, package build, type checking, and formatting are
checked after the change.

After building Ardo, capture diagnostic work separately from timing benchmarks:

```sh
node scripts/profile-native-api.mjs ardo
node scripts/profile-native-api.mjs library
# Optional second argument selects a preserved baseline dist directory.
node scripts/profile-native-api.mjs ardo /path/to/baseline/dist
```

The profiling script uses the public SDK timing collector plus white-box hooks
in the pinned SDK and adapter to log requests and inject the timed client. Those
hooks are confined to the diagnostic process and are not a supported application
API. Method timing collection and JSON byte counting have a measurement cost.

```sh
ARDO_DECLARATION_TSC=/path/to/typescript/bin/tsc \
ARDO_DECLARATION_NATIVE_BINARY=/path/to/platform/lib/tsc \
node scripts/benchmark-declaration-docs.mjs results.json \
  --modes=native-api-baseline,native-api,native-binary \
  --baseline=/path/to/baseline/dist --runs=7 --warmups=1
```

Warm source edits through an existing API and an existing CLI watch process,
as well as longer-session memory behavior, still need a separate comparison.
Neither cold-start benchmark establishes their relative update latency.
