# Ferriki production build comparison, October 20, 2026

I measured the source snapshot `493e53405e906fbc051d9e9d7a9d00a7d338a642`
against published Ardo 4.2.0 on Blacksmith. The paired build evidence passes
independent raw-timer, output, cache, lockfile, verifier, and host-guard checks.
This snapshot predates the Ferriki/Ferromark update merged in [#356](https://github.com/sebastian-software/ardo/pull/356).
**The updated engines in main `97c0dfc` are unmeasured, and #324 remains open.**

## Results

Five alternating warm pairs follow one warmup per lane. Warmups are retained
in the JSON evidence and excluded from these summaries. MAD is the unscaled
median absolute deviation.

| Lane                                           | Elapsed median (range; MAD), seconds | Maximum RSS median (range; MAD), MiB |
| ---------------------------------------------- | -----------------------------------: | -----------------------------------: |
| Ardo 4.2.0                                     |               6.58 (5.99–7.43; 0.31) |      1445.80 (1358.03–1515.50; 8.97) |
| Packed source `493e534`, package version 5.0.0 |            13.25 (11.23–13.34; 0.09) |     1248.13 (1194.50–1308.41; 21.39) |

The ratio of elapsed medians is +101.4%; reported maximum RSS is 13.7% lower.
The candidate's first two samples are near 11.2 seconds and its last three
near 13.3 seconds. Five pairs on one VM establish overhead in this snapshot;
they do not establish a precise fleet-wide percentage or identify its cause.

## Inputs and method

- Ferriki corpus/source: `676b8e953e6597a337fc644e712a4a30e5b8bea5`.
- Four-fence fixture SHA-256: `be71440bb815f448cacd039ff2909139f6b2099b7036d82fc321105122a00d04`.
- Original baseline lock SHA-256: `1e00152c77342c2f6a41b77fc58f5d9a779bb63d79b91d6bb1f3d31b7a393a96`.
- Candidate engines: Ferriki Core 0.13.0 and Ferromark 3.4.0.
- Separate identical offline asset caches: 325 manifest-verified files, 9,006,563 bytes; remote assets disabled.
- Ardo packing uses pnpm 11.20.0; both consumers use pnpm 10.34.5 and Node 24.21.0.

The baseline command is `pnpm exec react-router build`; the candidate uses its
supported `pnpm exec ardo build` entry point. `/usr/bin/time -l` measures the
build after removing `build`, retaining installed dependencies and verified
asset caches. Setup, installation, correctness checks, and diagnostic probes
are outside the timed intervals. React Router/Vite/compiler graphs differ;
this is a full production-build comparison and cannot isolate tokenizer cost.
The package version alone does not identify this source snapshot as the
unchanged published Ardo 5.0.0 release.

The runner reports macOS 26.3 arm64, Apple M4 Pro (Virtual), six logical CPUs,
and 24 GiB RAM (`blacksmith-6vcpu-macos-26`).

The measurement harness recorded runner details and sampled selected competing
compiler, runtime, and browser processes every second. The process guard cannot observe
physical-host scheduling or all VM background activity. Raw context and every
sample are retained in the artifact.

Both lanes keep the same two resolver adapters for sibling source inputs.
Each build passes its lane verifier; the candidate retains the original native
styled-token acceptance check. The shared semantic gate checks ten routes,
internal links/fragments, focusable code blocks and tables, fence source, and
metadata. A final-pair comparator rerun also passed independently. The gate
records expected differences in legacy chrome skip links, repeated navigation
links, and native trailing blank-line numbering; it does not claim identical HTML.

## Evidence and exclusions

[Run 39425047458](https://github.com/sebastian-software/ardo/actions/runs/39425047458)
retains artifact `ferriki-build-profile-39425047458-1`, ID `12266136486`,
SHA-256 `268b8fae740a46e8e225c65f42f2310752b183c2f516598eb317a0425990eaf5`.
Retention is 90 days. The adjacent JSON records all twelve raw timers, individual
RSS values, summary statistics, and receipt hashes. Independent checks covered
134 host snapshots and 894 output files.

I rejected the separate phase diagnostic despite the green workflow result.
The native prototype probe was installed repeatedly during config reevaluation,
and Vite windows combined separate config instances. Its counts and phase
durations are excluded. Raw diagnostic files remain available in the run artifact.

[Run 39423412925](https://github.com/sebastian-software/ardo/actions/runs/39423412925)
was incomplete: the original process matcher misclassified `/usr/libexec/triald`
as the `ld` linker. Its partial timings are excluded. The accepted run used a
corrected matcher that checked executable names.

## Interpretation and remaining work

The comparison confirms extra build time for this snapshot. It does not yet
explain where that time is spent. #324 remains open.

A focused local CPU profile and a few phase markers are sufficient next steps
for finding expensive compilation, bundling, initialization, or repeated work.
Concurrent builds limit conclusions from local wall-clock comparisons; they do
not require building a permanent benchmark workflow to inspect CPU hot spots.
The updated engines from `97c0dfc` also need their matching grammar assets for
an offline build. No further measurement or production optimization is claimed.

This PR retains only the report and raw timing record. The one-off Blacksmith
workflow and added benchmark tooling are not included. The exact measurement
harness remains available at commit `9fa98be` for provenance.
