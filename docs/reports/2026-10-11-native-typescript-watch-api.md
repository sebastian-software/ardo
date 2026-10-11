# Native TypeScript watch and declaration API

October 11, 2026. Follow-up to the
[pipeline benchmark](./2026-10-11-declaration-docs-performance.md) and
[profiling report](./2026-10-11-declaration-docs-optimization.md).

This records the isolated probes before integration. The subsequent
[native API integration](./2026-10-11-native-api-integration.md) replaces the
example's CLI prebuild and connects in-memory declarations to OXC and Vite.

The native CLI can already remain alive and update declarations in watch mode.
The current 7.1 nightly also exposes working in-memory declaration emission
through its JavaScript client. These are functional probes; neither path is
integrated into Ardo's production Vite plugin yet.

## Version and interface status

The npm registry reported `latest: 7.0.2` and
`next: 7.1.0-dev.20261011.1`. The isolated nightly probe used that exact package
and its matching Darwin ARM64 platform package. Workspace dependencies and the
compiler used for earlier benchmarks were unchanged.

The API maintainer's
[October 9 status](https://github.com/microsoft/TypeScript/issues/64709)
removes `/unstable` from the import paths and targets a stable API contract for
7.1. Changes remain possible before stable. Watch, incremental, and solution
builder APIs are explicitly excluded from that release's stable surface.
The [iteration plan](https://github.com/microsoft/TypeScript/issues/63703)
schedules 7.1 stable for November 24, 2026; this is a planned date.

| Capability                                  | Stable 7.0.2                          | Tested 7.1 nightly                             |
| ------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| CLI declaration emit and automatic watching | Available                             | Not separately retested                        |
| Persistent JavaScript API client            | Experimental `/unstable` entry points | `typescript/sync`, `typescript/async`          |
| Checked declarations returned as strings    | Absent from the inspected API         | `program.emitToString(EmitOnly.OnlyDts)` works |
| Public stable watch/builder API             | Unavailable                           | Not promised for 7.1 stable                    |

The [merged emit implementation](https://github.com/microsoft/typescript-go/pull/4699)
distinguishes whole-program `emitToString`, which honors `noEmitOnError`, from
selected-file `getDeclarationEmit`, which bypasses emit-blocking options. Ardo
should use the checked whole-program operation when publishing documentation.
Both API clients communicate with a separate native process; this does not
embed the Go compiler in Node's JavaScript heap.

## Persistent CLI probe

The probe starts TypeScript 7.0.2 once with:

```sh
/path/to/native-tsc --project tsconfig.docs.json --watch \
  --pretty false --preserveWatchOutput --listEmittedFiles --listFiles
```

The two-source-file project enables `declaration`, `declarationMap`,
`emitDeclarationOnly`, `noEmitOnError`, and `incremental`, and retains comments.
The same child PID handles every cycle. After each successful completion, the
probe invokes the current built `ardo/api` generator on the entry declaration
and selected compiler libraries, then verifies rendered documentation.

| Cycle                              | Verified result                                                   |
| ---------------------------------- | ----------------------------------------------------------------- |
| Initial emit                       | Inferred numeric return property and public pages                 |
| Imported value changes to a string | Entry signature and rendered return type update                   |
| JSDoc-only dependency change       | Exported value description updates                                |
| Semantic error                     | One error, no declaration/map writes, no documentation generation |
| Error recovery                     | Numeric type returns and generation resumes                       |
| Public exports removed             | Only the remaining public value has an API page                   |

The compiler leaves the old declaration for an unreachable dependency on disk.
Extraction must follow the current entry-point graph. Treating every file in
the output directory as a current public export would retain obsolete pages.

There are 18 declaration/map filesystem events across the six cycles. They do
not identify six complete, successful batches. The probe instead gates
generation on the compiler's completion line and error count. This is a
human-readable CLI status signal, so a production adapter must control output
options and test its parsing against supported compiler versions.

## Persistent API probe

One `API` instance from the pinned 7.1 nightly opens the same kind of configured
project. The relevant public calls are:

```ts
import { API, EmitOnly } from "typescript/sync"

const api = new API({ cwd: projectRoot })
let snapshot = api.createSnapshot({ openProjects: [configFile] })
const output = snapshot.getConfiguredProject(configFile)!.program.emitToString(EmitOnly.OnlyDts)

// After the host reports changed source files:
const previous = snapshot
snapshot = previous.update({
  fileNotifications: { changed: changedFiles },
  ensurePrograms: true,
})
previous.dispose()

// On shutdown:
snapshot.dispose()
api.close()
```

Five cycles verify initial inferred types and JSDoc, an imported value and
comment change, blocked output on a semantic error, recovery, and a removed
export with an unreachable module. Successful results contain declaration and
map strings. The error returns diagnostic 2322, `emitSkipped: true`, and an
empty output map. The configured declaration output directory never exists.

This probe tests compiler output, not an in-memory OXC-to-Markdown adapter.
Ardo's current extractor still reads declaration files. Using these strings
directly requires a file-reader abstraction that also handles imported package
declarations and the selected compiler libraries.

The [recorded results](./2026-10-11-native-typescript-watch-api.json) preserve both
probes' cycles and output. Absolute temporary paths and PIDs are replaced with
relative paths and a same-process assertion. The probes run on macOS ARM64 with
Node.js 24.21.0. Their tiny projects establish behavior and are not a latency
benchmark for Ardo's full input graph or evidence of cross-platform coverage.

## Integration implications

For a CLI implementation, Ardo can start one compiler per source project,
await its initial successful declaration batch before route discovery, and
retain that compiler for development. Each successful batch schedules serialized
extraction and publication. Compiler errors retain the last successful pages
and surface diagnostics; initial/build errors must follow the chosen failure
policy. Shutdown must dispose the compiler and any watchers.

When Ardo owns the compiler, its completion signal provides the generation
trigger. An additional declaration watcher is useful when another build owns
the compiler, but file events alone cannot distinguish partial output from a
successful batch. The production path still needs consistent input snapshots,
stale-generation rejection when another compile begins, deletion handling, and
cache invalidation for imported declarations and compiler libraries. No
transactional filesystem behavior is established by these probes.

For an API implementation, Vite or Ardo supplies file notifications to the
persistent compiler session, then receives one checked output map. This removes
the declaration write/read cycle and CLI completion parsing. Stable automatic
watching through the API remains a separate upstream feature. The next useful
evaluation is the complete API-to-OXC path on Ardo's real project, with startup,
changes, errors, removals, memory, and end-to-end timing measured together.
