# Native TypeScript API integration

October 11, 2026. Follow-up to the [isolated watch/API probes](./2026-10-11-native-typescript-watch-api.md).

The later [startup-cost investigation](./2026-10-11-native-api-startup-cost.md)
separates SDK loading and request work, removes two-stage import resolution, and
records a paired before/after benchmark. The timings below describe the initial
integration before that change.

The source documentation backend now uses the official asynchronous native
TypeScript API for both builds and development. The library example and Ardo's
own documentation select this backend through `ardo({ api: ... })`. They no
longer run a separate TypeDoc or CLI declaration prebuild for their API pages.

## Node and Go connection

The official Node client starts the platform's native compiler as a child
process. Its asynchronous transport uses JSON-RPC over stdin/stdout. Ardo calls
that client; it does not implement the wire protocol or custom Go bindings.

```text
Vite build / source watcher
  -> NativeApiProject
  -> official typescript/async client
  -> persistent native compiler process
  -> checked declaration strings and diagnostics
  -> OXC declaration graph
  -> API documentation model
  -> Markdown routes
```

The build and update operations share one adapter and one documentation model.
An `API` instance remains alive during a development-server session. Host file
notifications produce updated compiler snapshots; old snapshots are disposed.
The host calls `program.emitToString(EmitOnly.OnlyDts)` and receives a complete
output map. Declared output paths identify virtual files, not files written to
disk. A declaration reader overlays those strings on the real package and
compiler-library files.

The API client handles subprocess startup, transport, and termination. Ardo
closes the client after a one-shot generation or server shutdown. Vite creates a
replacement server before closing the previous server during restart. Compiler
sessions are therefore associated with their server environments so closing the
old server cannot terminate the new session.

## Package and public API

The tested compiler is `typescript@7.1.0-dev.20261011.1`, installed through the
npm alias `@typescript/native`. This is a nightly, not a released 7.1 beta. The
alias permits the existing TypeScript 6 development tooling to remain installed.
The native SDK and OXC are optional peers; source API documentation requires
both. The native client is kept external in the package build. The documentation
backend and parser load only when the source API option is activated. A freshly
installed scaffold without either optional peer builds successfully.

The [October 9 upstream status](https://github.com/microsoft/TypeScript/issues/64709)
targets a stable 7.1 API surface and future client compatibility. Changes remain
possible before stable. Automatic watch, incremental builder, and solution
builder APIs are excluded from that stable surface. The new adapter uses Vite's
watcher and snapshot notifications rather than waiting for those builder APIs.

The [emit API](https://github.com/microsoft/typescript-go/pull/4699) distinguishes
checked whole-program emission from selected-file declaration retrieval that
bypasses emit-blocking options. Ardo uses the checked operation.

```ts
import { ardo } from "ardo/vite"

ardo({
  api: {
    entryPoints: ["./src/index.ts"],
    tsconfig: "./tsconfig.api.json",
    out: "api-reference",
  },
})
```

`api: true` defaults to `src/index.ts` and `tsconfig.json`. The programmatic
`generateNativeDocs` function handles one-shot cleanup. `NativeApiProject`
provides reusable `extract`, `generate`, and `close` operations for hosts that
supply absolute changed/created/deleted file paths.

Each extraction reads the original configuration and applies an in-memory
configuration layer that enables declarations and maps, preserves comments,
turns off `noEmit`, and enables `noEmitOnError`. `extends`, libraries, module
settings, paths, and custom conditions remain controlled by the project. The
original configuration is not rewritten. The API's output-to-source mapping
links emitted entry points and imports to their checked source files.

Module lookups use the compiler's cached resolution and per-import resolution
mode. This includes tsconfig aliases, custom package conditions, NodeNext
import/require selection, and explicit `resolution-mode` attributes. Physical
package declarations are read only when member expansion needs them. Compiler
library metadata selects global bases without treating unrelated package
modules as global interfaces.

## Development behavior

Initial generation finishes before route discovery. Initial/build compiler
errors fail generation. During development, errors retain successful pages and
appear in Vite's error overlay. Recovery resumes publication.

The watcher tracks project inputs, extended configurations, and package
metadata in the project. Events are debounced and processed serially. A snapshot
overtaken by a new event before publication is discarded. Generated output does
not feed back into the source watcher. Removed exports remove obsolete pages.

The shared writer retains the generated-directory protection. Native generation
updates changed files with an atomic rename, keeps unchanged files' modification
times, and removes obsolete files after writing replacements. This is atomic
per file, not a transaction across every page. Unchanged documentation avoids a
reload even when source implementations change.

## Validation and measured scope

Focused tests use the actual pinned compiler, including inferred types,
imported generic JSDoc, global `Error` members, configuration preservation,
paths, package conditions, NodeNext formats, explicit import modes, errors,
recovery, export removal, extended configs, and new source files. Plugin tests
cover route order, stale snapshot rejection, unchanged-output reuse, diagnostic
publication, shutdown, and rejecting simultaneous native/TypeDoc configuration.
All 411 unit tests across 72 files pass with coverage. A real Vite filesystem
watcher test verifies source/dependency/JSDoc updates and server restart without
a declaration output directory. All 35 integration tests across six files pass
in the final run, including the library's ten HTML build tests through the
normal Vite configuration and the freshly installed scaffold. Ardo's normal
documentation build prerenders every one of
its 86 API pages, including all 33 MarkdownConfig properties.

The [benchmark JSON](./2026-10-11-native-api-integration-benchmark.json) records
three measured fresh Node processes per mode/project after one discarded
warmup. Mode order rotates. Measurements include native process startup, checked
compilation, extraction, Markdown rendering/writing, and session disposal.
They exclude installation, package build, configuration setup, verification,
and the subsequent Vite/HTML build. OS caches are uncontrolled.

| Input             |     TypeDoc | Native Node CLI + OXC | Native binary + OXC | Native API + OXC |
| ----------------- | ----------: | --------------------: | ------------------: | ---------------: |
| Ardo public entry | 2,215.47 ms |             574.80 ms |           471.55 ms |        520.42 ms |
| Library example   |   583.59 ms |             335.38 ms |           237.57 ms |        273.88 ms |

These are medians for this macOS ARM64 / M1 Ultra / Node.js 24.21.0 run.
TypeDoc uses its existing TypeScript 6.0.3 compiler. All native modes use the
same pinned 7.1 compiler and produce identical page paths and Markdown bytes:
85 exports / 86 pages for Ardo, 11 exports / 12 pages for the library. The API
writes zero declaration or map files. Compiler time is included in the API
mode's `generateMs`; its zero `compilerMs` means no separately timed CLI phase.
Built API chunk hashes are recorded with the source revision and dirty flag.

The API is faster than the Node CLI pipeline in this run but slower
than the direct native binary. The transport is not a universal cold-start
speedup. Its benefits include a maintained Node interface, structured batch
completion and diagnostics, compiler resolution, persistent sessions, and
removing declaration file I/O. This benchmark does not establish warm edit
latency, memory behavior during long sessions, or feature parity with TypeDoc.

## Remaining migration work

The existing TypeDoc integration and dependency remain available for existing
projects until a major-version migration. The native source backend has no CLI
or TypeDoc fallback. Existing-declaration extraction remains a lower-level input
to the same OXC model and is used in tests and benchmarks.

Original-source links, full TSDoc semantics, namespace pages, arbitrary mapped
and conditional member expansion, solution/project-reference orchestration,
long-session memory measurements, and wider platform coverage remain work.
The previous 96.5% oracle agreement describes selected comparison fields; it is
not a percentage of all documentation capabilities.

Vite ignores `node_modules` by default, so dependency installation or edits there
require a development-server restart. Mixed import/require usages of one package
request that resolve to different declarations in one source file currently
report incomplete expansion rather than choosing the wrong declaration. Bundled
`outFile` projects without per-source declaration mappings are not supported.

The compiler drops some inline member JSDoc placed after an opening brace on the
same line, while normal preceding-line JSDoc survives. A useful follow-up is
recovering missing comments from native source symbols through the same client;
this need not introduce a second compiler backend.
