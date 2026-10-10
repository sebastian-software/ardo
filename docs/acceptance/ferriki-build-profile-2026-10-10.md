# Ferriki homepage build profile, October 10, 2026

This follows [#324](https://github.com/sebastian-software/ardo/issues/324) with paired builds of published Ardo 5.0.0 and the candidate from [#326](https://github.com/sebastian-software/ardo/pull/326)/[#327](https://github.com/sebastian-software/ardo/pull/327). The candidate has a small lower elapsed median and a higher reported maximum RSS in this series. The overlapping ranges and single diagnostic run per lane do not establish a general speedup. #324 remains open.

## Controlled inputs and correctness

Both lanes use Ferriki source `676b8e953e6597a337fc644e712a4a30e5b8bea5`, the four-fence homepage corpus from the [original acceptance](https://github.com/sebastian-software/ferriki/blob/1224a2dc3997e3666d69f66d3e0184de1da2c72a/docs/acceptance/ardo-ferromark.md), and the native registry lock from `1224a2dc3997e3666d69f66d3e0184de1da2c72a`. The candidate uses a real packed Ardo build at runtime commit `c97b6852147c8644f6ef926193d9a98e88b40eaa`; its final PR head `8f702496af7a37bb062079bd7b5242fdabccb421` only adds stacked-PR CI coverage. This tarball is an integration input, not a published package or a dependency on an unpublished engine. Its engines resolve from npm: Ferromark 3.4.0 and Core 0.13.0, with matching sidecars. The baseline uses Ferromark 3.1.0/Core 0.10.0.

All unrelated package versions remain constant. The package-set differences are the engine updates, the packed Ardo input, and removal of the assembler's Oxc/magic-string dependencies and orphaned bindings/runtime versions. Some peer-resolution suffixes differ despite identical package versions; the receipt retains both importers. Identical disposable workspace permissions enable esbuild and unrs-resolver. Frozen installation passes in both lanes.

Before timing, both lanes pass the complete homepage build verifier. Every timed output then passes the same verifier outside the timer: 10 pages, 275 internal links/fragments, benchmark provenance, native fence text/colors/metadata/highlights, unknown-language fallback, and focusable pre/table output. The archives include 11 HTML files per build, including the SPA fallback.

Each lane has a separate identical cache of 325 payloads (9,006,563 bytes), verified against the historical asset manifest by SHA-256 and size. Remote assets are disabled. The runner verifies unchanged cache bytes after every build. All raw timers, logs, host snapshots, CPU profiles, HTML/client archives, frozen-install receipts, lockfiles, and the candidate tarball are retained locally. The [JSON receipt](ferriki-build-profile-2026-10-10.json) commits every raw timer, sample/cache/HTML hashes, package differences, input hashes, and raw diagnostic events.

## Five warm pairs

Apple M1 Ultra, 20 logical CPUs, macOS 27.0.1 arm64, Node 24.21.0, pnpm 11.25.0. Both lanes inherit `NODE_OPTIONS="--max-old-space-size=16384 --no-deprecation"`. One unmeasured warm-up per lane precedes five serial pairs; pair order alternates. Before each invocation the runner records host processes and refuses competing heavy Node/Rust/compiler work. No competing heavy build was present in the recorded series.

The timed command is `/usr/bin/time -l -o <sample>/time.txt pnpm exec react-router build`. Only `homepage/build` is removed between invocations; installed dependencies, the pnpm store, and asset caches remain. Installation, semantic verification, browser tests, and diagnostic instrumentation are outside the timer.

| Lane                 | Elapsed median (range; MAD), seconds | Reported max RSS median (range; MAD), MiB |
| -------------------- | ------------------------------------ | ----------------------------------------- |
| Published Ardo 5.0.0 | 9.50 (9.38–9.61; 0.10)               | 1254.62 (1228.83–1333.25; 25.80)          |
| Packed candidate     | 9.35 (9.20–9.45; 0.07)               | 1342.22 (1338.00–1387.91; 4.22)           |

The per-lane median difference is 0.15 s (1.58%) lower elapsed and 87.59 MiB (6.98%) higher reported maximum RSS for the candidate. This is macOS time's maximum resident-set statistic, not aggregate simultaneous child-process memory or isolated native allocations. Every sample, including the candidate's higher first RSS, is retained.

## Separate diagnostic builds

One additional build per lane uses Node CPU profiling, native prototype probes, and Vite hook timestamps. A version-checked loaded-source adapter brackets React Router 8.4.0's prerender request planning, preview startup, rendering, and cleanup without editing the installed package on disk. These instrumented builds are excluded from the warm series.

| Diagnostic window                                    | Published Ardo 5, ms | Candidate, ms |
| ---------------------------------------------------- | -------------------: | ------------: |
| Process startup to first config-resolved event       |               607.97 |        614.59 |
| Client build, including native work and plugin waits |              4072.80 |       4015.48 |
| SSR build, including native work and plugin waits    |              4431.66 |       4470.56 |
| Client emission after transform/buildEnd             |               352.79 |        348.81 |
| SSR emission after transform/buildEnd                |                50.75 |         54.48 |
| Prerender, including preview startup/cleanup         |               222.76 |        248.26 |

The candidate records 108 preparation calls totaling 10.13 ms, 27 metadata-only renders totaling 3.52 ms, and 63 module renders totaling 5939.69 ms. Published Ardo 5 records 63 `JsxCompiler.compile` calls totaling 5860.59 ms. Its standalone `compileJsx` metadata/scope calls are outside the prototype probe, so the legacy count does not represent all parses. The route regression test separately proves one preparation and one final module render per candidate transform.

Native module rendering includes highlighting, JSX emission, source-map/module work, and first language loading. The native timing does not isolate tokenization. The inclusive Vite windows already contain that native work and overlapping plugin waits; do not add them to the native totals. Preparation and metadata-only rendering are small in this candidate diagnostic. Repeated route transforms still highlight: the prepared-document refactor removes repeated parsing within one transform, not the framework's repeated transforms. This profile does not justify a persistent document/output cache or a tokenizer attribution.

## Reproduction and limits

Create disposable Ferriki checkouts at the common source above. Copy the original native lock from `1224a2dc` into both homepage directories. Keep the baseline manifest at `ardo: ^5.0.0`; build/pack the candidate Ardo and point only the candidate's Ardo dependency to that tarball. Install, compare package sets/importers, and confirm unchanged unrelated versions before frozen installation and correctness checks. Do not commit temporary tarball overrides to Ardo's source manifests.

Verify each historical `assets/shiki/release-manifest.json` payload by SHA-256/size, then copy it to `<lane>/cache/<sha256>`. The runner expects each cache adjacent to its homepage directory. On a quiet macOS host, run:

```sh
node scripts/profiling/paired-builds.mjs \
  /absolute/baseline/homepage /absolute/candidate/homepage \
  /absolute/evidence-directory 5
```

For a separate diagnostic, add `profileBuild()` from `scripts/profiling/vite-phases.mjs` to both disposable Vite plugin lists. Set `ARDO_PROFILE_PROJECT` to the installed homepage and `ARDO_PROFILE_OUTPUT` to a fresh NDJSON path. Use the same offline cache and Node options, then invoke:

```sh
node --cpu-prof --cpu-prof-dir=/absolute/diagnostic \
  --import /absolute/ardo/scripts/profiling/native-phases.mjs \
  --import /absolute/ardo/scripts/profiling/framework-phases.mjs \
  node_modules/@react-router/dev/bin.cjs build
```

The framework probe intentionally requires the pinned React Router 8.4.0 source and fails if its boundaries change. The runner is macOS-specific (`time -l`) and records the current interpreter/toolchain rather than enforcing historical versions. Diagnostic phase results are descriptive single runs; raw CPU profiles are retained for further investigation.

Ardo 4.2 was not rerun in this series. The original 7.87 s versus 9.90 s comparison used pnpm 10.34.5/macOS 27.0 and different compiler/dependency graphs; these pnpm 11.25.0/macOS 27.0.1 measurements cannot establish that the historical overhead is resolved. Further paired legacy reproduction and exclusive highlighting/startup analysis remain in #324. Adoption issues #299/#300 and draft #315 are superseded by Ardo 5 adoption, not evidence that the performance investigation is complete.
