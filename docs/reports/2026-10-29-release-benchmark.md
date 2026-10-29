# Ardo 6.0 final release benchmark

Measured October 29, 2026 for the Ardo 6.0 final release, at
[`7f5ea0c`](https://github.com/sebastian-software/ardo/commit/7f5ea0c88517132734ae3aaed5811326b5cf1093),
with a clean working tree. The measured source combines Ferromark 3.6.0 with the
updated dependency set for Ardo 6.0. The raw report records the manifest version
as `5.0.0`; release automation applies the `6.0.0` version bump separately. The
source commit and lockfile identify the measured implementation and dependencies.

[Raw samples, corpus manifests, source hashes, and machine details](./2026-10-29-release-benchmark.json)
are stored beside this report. The
[measurement harness](../../scripts/benchmark-release.mjs) installs nothing and
uses the versions already resolved by the workspace lockfile.

## Results

| Workload                | Input and output                                                       |    Median |     Sample range |
| ----------------------- | ---------------------------------------------------------------------- | --------: | ---------------: |
| Guide compilation       | 19 English MDX guides, 210,503 input bytes → JSX with highlighted code |  82.02 ms |   80.89–85.12 ms |
| Code block highlighting | 185 fences, 35,629 code bytes → JSX with light and dark colors         |  76.58 ms |   74.90–77.61 ms |
| API generation          | 3 entry points, 192 exported declarations → 142 Markdown pages         | 655.13 ms | 644.59–674.65 ms |

The homepage rounds these medians to 82 ms, 77 ms, and 655 ms. These are three
separate workloads. Guide compilation already includes highlighting; the first
two rows overlap and must not be added together. None measures a complete
Ardo documentation-site build or establishes a speedup over another tool.

Guide JSX, fence JSX, and API Markdown output hashes match the
[previous Ferromark 3.5.1 run](https://github.com/sebastian-software/ardo/blob/9c84cb7fe0a7926f3624944ad9b31a02034b2439/docs/reports/2026-10-29-release-benchmark.json).
This checks the measured output across the dependency update; it does not cover
every capability of either release.

## Environment and versions

- Apple M1 Ultra, 20 logical CPUs, 64 GiB RAM, ARM64.
- macOS 27.0.1, build 26A434; Node.js 24.22.1.
- Ferromark npm package 3.6.0, using its released native JSX binding.
- Ferriki Rust crate 1.1.2 embedded in that binding, as pinned by
  [Ferromark 3.6.0's Cargo.lock](https://github.com/sebastian-software/ferromark/blob/v3.6.0/Cargo.lock).
  This measures the native path used for Ardo's Markdown fences, not the separate
  `@ferriki/core` JavaScript compatibility API.
- TypeScript `7.1.0-dev.20261011.1`, Ardo's deliberately pinned native compiler.
  This is a nightly version, not a stable TypeScript release.
- Oxc parser 0.156.0 validates generated JSX outside the timed windows.

The source-file and lockfile hashes in the raw report identify the dependency
and API input state. The report also records the harness hash, every guide's
path, byte count and SHA-256, and every fence's source guide, index, language,
metadata, byte count and SHA-256. The corpus includes the nested release and
migration guides. Language labels are preserved, including aliases and plain
text; they are not normalized into an artificial language mix.

## Guide compilation

Each iteration compiles all 19 English guide sources under
`docs/app/content/guide`, in sorted path order, through the public
`JsxCompiler.compile` API. It produces JSX fragments and native metadata, with
code highlighting enabled. The options mirror the docs' heading attributes,
frontmatter, heading IDs, footnotes, autolinks, callout components, and
`github-light`/`github-dark` themes. Line numbers retain their default of false.

The compiler and theme/language caches are warm. Source reading, compiler
construction, initial asset loading, JSX validation, and result hashing happen
outside timing. Downloads are explicitly disabled. The timed work includes
parsing, native passes, highlighting, JSX rendering, and binding result
materialization. It excludes Ardo's route-module wrapper, YAML frontmatter
conversion, localization, Vite transforms, bundling, prerendering, search-index
construction, and HTML output.

This is a native compilation workload on Ardo's actual source files, not a
measurement of Markdown parsing alone or the complete Ardo route pipeline.

## Code block highlighting

The harness takes the 185 fences returned by the same guide compilation, in
source order, retaining code, language and fence metadata. Each iteration renders
them through the same compiler's public `renderCodeBlock` API, producing native
JSX with both themes. This includes fence metadata handling, highlighting, and
JSX serialization through the Node binding. It excludes document parsing and
compiler/asset initialization. Plain-text fences remain part of the actual
workload; this is not a claim that every block requires syntax tokenization.

The compiler state is shared with the guide workload. These figures describe
warm build-time highlighting, not first use, asset downloads, browser execution,
HTML serialization through Shiki's API, or a comparison with Shiki/WASM.

## API generation

Each invocation uses a fresh Node process and native compiler session, importing
Ardo's built `api` entry and calling `generateNativeDocs` with the same three
entry points as the docs site:

- `ardo/ui`: `packages/ardo/src/ui/index.ts`
- `ardo/runtime`: `packages/ardo/src/runtime/index.ts`
- `ardo/config`: `packages/ardo/src/config/index.ts`

The project uses `packages/ardo/tsconfig.api.json`. The timed region includes
module import, native compiler startup and checked source analysis, declaration
extraction, Markdown rendering and writing, and compiler-session disposal. It
excludes the Node process launch, temporary-directory setup, output verification,
cleanup, dependency installation, Ardo's package build, and the documentation-site
build. Filesystem and OS caches are uncontrolled and generally warm.

There are 192 exported declaration records and 142 generated Markdown pages,
including the index. Export aliases do not each require a separate page.
Every written page is checked against its returned content and generated
frontmatter after timing. Path/content hashes are identical across the warmup
and all seven measured invocations.

Two extraction diagnostics report preserved type expressions that cannot be
expanded into individual properties. `ArdoThemeTokens`, `ArdoOwlMark`, and
`ArdoOwlMarkProps` have incomplete property expansion. Their type expressions
remain in the output; the raw report includes the exact diagnostics and names.
This result does not claim complete expansion of every TypeScript type or
feature parity with TypeDoc.

## Sampling and correctness gates

The guide and fence workloads each receive one untimed warmup window of at least
500 ms. Seven measured rounds follow, alternating which workload runs first.
Each sample repeats its complete corpus until at least 500 ms has elapsed;
`elapsedMs / iterations` gives the per-corpus sample. The table reports the
median of those seven samples. The range is the smallest to largest sample,
not a confidence interval or a per-document latency range.

API generation receives one untimed fresh-process warmup and seven measured
fresh-process invocations. Its median and range use the measured region inside
each process, not total subprocess wall time. All workloads run sequentially;
no build or other benchmark runs concurrently.

Before engine timing, generated guide and fence JSX must parse without Oxc
errors, guide bodies and heading lists must be nonempty, and the fence corpus
must be nonempty. Output SHA-256 values must remain identical after every
measured window. The API path must finish without a compiler error, write
nonempty pages, and preserve the same output, counts and extraction diagnostics
across all invocations. These gates establish deterministic valid output for
this run; they are not a substitute for the repository's semantic tests.

## Reproduce

From the recorded source revision, with the workspace dependencies installed:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm docs:build # populate verified native theme and language asset caches
node scripts/benchmark-release.mjs /tmp/ardo-release-benchmark.json
```

Run the measurement after the build has finished, without another heavy local
job. The harness disables remote asset access and fails if required cached
assets are unavailable. It reads the current corpus and records its hashes;
changing source, dependencies, compiler options, machine, or cache lifecycle
creates a different experiment. Timings are observations on this machine, not
portable performance guarantees or CI thresholds.

## Claim changes

The current homepage and README no longer repeat the earlier 2.6×
pulldown-cmark, 4.7× Shiki/WASM, or 4.3× TypeDoc factors. Those came from different
versions, corpora, output formats and measurement boundaries. The dated upstream
reports and Ardo's October 11 reports remain historical evidence; this run does
not update or contradict their original experiments.

Each current numerical claim links to the matching section above and names its
boundary, cache lifecycle, machine and measurement date. No new comparative
factor is claimed: equivalent current comparator workloads and output parity
have not been established in this campaign.

This report is the benchmark baseline for Ardo 6.0 final and addresses issue
[#395](https://github.com/sebastian-software/ardo/issues/395). Refresh the evidence
when the measured implementation, dependencies, corpus, or measurement method
changes.
