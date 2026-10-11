# Declaration pipeline profiling and optimization

October 11, 2026. Follow-up to the
[initial pipeline benchmark](./2026-10-11-declaration-docs-performance.md).

CPU profiling identified avoidable work in comment lookup and generic indexing.
The supported extractor now finds the preceding comment by binary search, skips
type substitution when there are no bindings, and builds the reference/scope
index only when generic substitution needs it. These are per-extraction changes;
they introduce no persistent cache or new public configuration.

## Before and after

The baseline is the built API at `a45fd31`. Both implementations use the same
installed dependencies and native TypeScript 7.0.2 CLI. Each sample starts a fresh
Node process and ends after the generated Markdown has been written and the
process exits. Type checking, declaration maps, comments, library discovery,
and compiler version validation remain included in source scenarios. Existing
declarations are prepared outside timing and reported separately.

The complete pipeline uses approximately **14% less time for Ardo** and
**18–19% less for the library** in both runs. Existing-declaration generation
uses **29–33% less time**. Absolute timings vary between runs; the paired
comparisons retain that variation.

| Run / project / scenario                              | Baseline median (min–max), ms | Optimized median (min–max), ms | Less elapsed time |
| ----------------------------------------------------- | ----------------------------: | -----------------------------: | ----------------: |
| Complete comparison: Ardo, checked source pipeline    |                 648 (624–671) |                  558 (536–608) |             14.0% |
| Complete comparison: Ardo, existing declarations      |                 303 (290–323) |                  204 (203–214) |             32.5% |
| Complete comparison: Library, checked source pipeline |                 400 (395–418) |                  325 (318–335) |             18.8% |
| Complete comparison: Library, existing declarations   |                 259 (254–272) |                  183 (180–187) |             29.3% |
| Independent repeat: Ardo, checked source pipeline     |                 681 (647–704) |                  588 (556–781) |             13.6% |
| Independent repeat: Ardo, existing declarations       |                 306 (291–339) |                  218 (208–226) |             28.7% |
| Independent repeat: Library, checked source pipeline  |                 424 (408–434) |                  346 (340–356) |             18.3% |
| Independent repeat: Library, existing declarations    |                 274 (259–286) |                  194 (187–197) |             29.1% |

The [complete comparison](./2026-10-11-declaration-docs-optimization.json) and
[independent repeat](./2026-10-11-declaration-docs-optimization-repeat.json) retain
all samples, phase medians, environment versions, source state, and SHA-256
hashes of the measured built implementations. Each has seven measured samples
and one discarded warmup per mode and project. Modes run sequentially, rotating
order; OS caches and unrelated machine activity are uncontrolled. The complete
comparison also includes TypeDoc, the JavaScript compiler, and a direct native
executable. CPU profiling is disabled for these timing runs.

The harness hashes each sorted output path and its Markdown contents after the
timed process exits. Every native baseline, optimized, and reuse sample must
produce the same hash. Both source projects also produce identical Markdown with
the workspace JavaScript compiler. Ardo retains **85 exports, 86 pages, and
70,183 Markdown bytes**; the library retains **11 exports, 12 pages, and 8,555
bytes**. TypeDoc produces a different page tree and content, so its speed remains
a comparison of actual workflows rather than equivalent rendering features.

## Where the extraction time went

The [aggregated profiles](./2026-10-11-declaration-docs-profiles.json) record
100-microsecond Node stack samples for one run of each project, with and without
compiler work. They diagnose hotspots; the instrumented durations are not used
for speedup claims. Self sample time excludes child frames. In particular,
`spawnSync` represents time the Node parent waits for a child, not native
compiler CPU consumption.

| Existing-declaration profile / self sample time | Ardo before → after, ms | Library before → after, ms |
| ----------------------------------------------- | ----------------------: | -------------------------: |
| Comment lookup                                  |              67.3 → 1.7 |                 45.0 → 1.0 |
| Full generic-reference/scope visitor            |              33.0 → 0.2 |                 28.9 → 0.0 |
| JSON AST deserialization                        |             56.5 → 58.0 |                53.6 → 56.5 |
| Normal OXC parser wrapper                       |             24.0 → 24.3 |                23.8 → 23.4 |

Previously `readComment` copied and reversed the entire file's comment array for
each declaration/member, then skipped later comments. Large standard-library
files made that expensive. The new lookup uses source-ordered comment spans to
find the nearest preceding comment and scans only its adjacent comment chain.
Regression coverage includes unrelated/nested comments, comments after the
declaration, lint comments, CRLF, and Unicode positions.

The previous generic visitor walked every node in every loaded library even
when there was no substitution to perform. The new module-local index is built
on demand and reused within that extraction. Tests retain inner generic
shadowing and independently specialize the same base with different bindings.
Parsing, syntax diagnostics, header-reference validation, and declaration/global
indexing still run for the selected library graph.

## Why the whole workflow is not ten times faster

Microsoft's [native-port announcement](https://devblogs.microsoft.com/typescript/typescript-native-port/)
reports roughly tenfold improvements for compiler runs on large projects.
That factor does not include Ardo's Node startup, parser transfer, extraction,
rendering, and Markdown writes. The comparable compiler measurement here uses
the same checked declaration-emission configuration and the optimized OXC
extractor for both JavaScript TypeScript 6.0.3 and native TypeScript 7.0.2.

Ardo's compiler phase is **1,753 ms with JavaScript versus 249 ms with Go**,
a 7.04x factor. The library's compiler factor is 7.10x (252 versus
36 ms). Ardo's complete source-to-Markdown factor is 4.34x (2,023
versus 466 ms), because the other stages still run. Compiler versions differ; this
compares these installed compilers on the same project/configuration and does
not isolate implementation language from compiler-version changes.

| Same checked source-to-Markdown workflow | Ardo median (min–max), ms | Library median (min–max), ms |
| ---------------------------------------- | ------------------------: | ---------------------------: |
| JavaScript compiler + optimized OXC      |       2,023 (2,001–2,104) |                499 (496–515) |
| Direct Go executable + optimized OXC     |             466 (452–488) |                230 (229–234) |
| Native Node CLI + optimized OXC          |             558 (536–608) |                325 (318–335) |
| Existing TypeDoc generator               |       2,107 (2,080–2,162) |                571 (568–584) |

The installed native CLI is a Node launcher that subsequently starts the Go
executable. It is invoked once to validate the version and once for the project
emit. Calling the platform executable directly removes approximately 90–100 ms
across those two invocations on this machine. The existing example already
accepts that executable through `ARDO_DECLARATION_TSC`; the benchmark isolates
it with `ARDO_DECLARATION_NATIVE_BINARY`. There is no automatic resolver coupled
to the compiler package's private platform-package layout.

| Ardo worker phase median                           | Native Node CLI, ms | Direct executable, ms |
| -------------------------------------------------- | ------------------: | --------------------: |
| API module import                                  |                   7 |                     7 |
| Compiler version validation                        |                  58 |                    10 |
| Checked project emit + file listing                |                 292 |                   249 |
| Library loading, extraction, rendering, and writes |                 150 |                   147 |

A separate `--extendedDiagnostics` probe of the native executable reports
66 ms for parsing, 6 ms for binding, 138 ms for checking, and 39 ms for emit
on this graph. These are the compiler's diagnostic totals from one invocation,
recorded with the profiles, rather than repeated benchmark phase medians.

Phase medians need not sum to the parent wall median. The remaining difference
includes the fresh Node process's startup/exit and work outside the explicitly
timed worker phases. The compiler processes Ardo's 746-file input graph; OXC
loads 27 API/dependency declaration files and 61 selected compiler libraries.
The small library also loads its selected default libraries, so much of its
parser cost is fixed work unrelated to the number of public exports.

## Remaining parser potential

Standard OXC parsing transfers a JSON AST from Rust and constructs JavaScript
objects with `JSON.parse`. That transfer remains the largest extraction hotspot:
approximately 54–58 ms of self samples, compared with 22–26 ms inside the normal
parser wrapper. Switching to the asynchronous parser alone would still perform
the JavaScript deserialization on the calling thread.

An isolated copy of the optimized build enables OXC 0.127.0's
`experimentalRawTransfer` option. The
[experiment results](./2026-10-11-declaration-docs-oxc-experiment.json) retain the
candidate's built hash, seven samples and one warmup per project. In this file,
`declarations-baseline` labels the experimental candidate, while `declarations`
labels the supported optimized implementation.

| Existing declarations | Supported median (min–max), ms | Experimental raw-transfer median (min–max), ms | Less elapsed time |
| --------------------- | -----------------------------: | ---------------------------------------------: | ----------------: |
| Ardo                  |                  269 (246–289) |                                  202 (184–216) |             25.1% |
| Library               |                  197 (194–201) |                                  147 (145–150) |             25.5% |

The paired medians differ by approximately **68 ms for Ardo and 50 ms for the
library** in this experiment. This is a compiler-free experiment, with variable
absolute timings, rather than an additional source-pipeline speedup claim.

This flag exists in the installed implementation but is absent from its declared
`ParserOptions`. Its platform/runtime support is limited, and this experiment
does not run the complete extraction suite or validate other runtimes. It is
not enabled in the shipped extractor. A separate guarded experiment with a
supported fallback and full correctness coverage is the next useful parser
investigation.

The isolated `experimentalLazy` path is not a drop-in replacement. Its comment
objects omit `value`; deriving comment text from source spans gets past that
first error, but public exports such as `defineConfig` and `loadConfig` remain
unresolved and the completeness gate rejects the run. It also introduces AST
buffer-lifetime and visitor contracts that need deliberate integration. No
timing claim is made for that failed path.

The other substantial opportunity is a persistent documentation process that
reuses parsed compiler libraries and unchanged declarations, plus declarations
already produced by the regular package build. That requires invalidation by
file content and compiler/library version, isolated project state, and changed
source/JSDoc/removal/error watch tests. It is not implemented or included as an
assumed speedup. The backend remains opt-in while migration and build/watch
integration are completed.

## Validation and reproduction

All 397 unit tests across 69 files pass with coverage; all 133 declaration tests
also pass with the native CLI. All 35 integration tests across six files pass
using the direct native executable, including declaration-to-HTML output.
Repository type checking, lint, formatting, and package builds pass; lint
retains its warnings. The four-profile native evaluation exactly reproduces
the committed comparison JSON, including types, comments, modifiers, and
diagnostics.

Build and preserve the baseline's entire `dist` directory before changing the
implementation. Its parent directory needs `package.json` with
`{"type":"module"}` and access to the same dependencies, for example a
`node_modules` symlink to `packages/ardo/node_modules`. Rebuild the candidate,
then run:

```sh
ARDO_DECLARATION_TSC=/path/to/native-package/bin/tsc \
ARDO_DECLARATION_NATIVE_BINARY=/path/to/platform-package/lib/tsc \
node scripts/benchmark-declaration-docs.mjs /tmp/comparison.json \
  --baseline=/tmp/preserved-baseline/dist \
  --modes=typedoc,native-baseline,native-one-pass,native-binary,workspace-one-pass,declarations-baseline,declarations

ARDO_DECLARATION_TSC=/path/to/native-package/bin/tsc \
node scripts/benchmark-declaration-docs.mjs /tmp/repeat.json \
  --baseline=/tmp/preserved-baseline/dist \
  --modes=native-baseline,native-one-pass,declarations-baseline,declarations

ARDO_DECLARATION_TSC=/path/to/native-package/bin/tsc \
node scripts/benchmark-declaration-docs.mjs /tmp/profile-result.json \
  --runs=1 --warmups=0 --modes=native-one-pass,declarations \
  --profile-dir=/tmp/ardo-profiles
```

Load the `.cpuprofile` files in a Node-compatible profile viewer. To reproduce
the raw-transfer experiment, copy the candidate's built `dist` again, add only
`experimentalRawTransfer: true` to the API bundle's `parseSync` options, and
select that copy as `--baseline` with modes
`declarations-baseline,declarations`. Keep that copy isolated from the
production package. The benchmark installs nothing and removes its temporary
configs, declaration output, and generated routes; requested CPU profiles stay
in the supplied directory.
