# CLI Reporting and Updates

Ardo uses [app-tracking](https://app-tracking.sebastian-software.com/) for optional
CLI usage reporting and public release metadata. Reporting starts only after an
explicit choice. Update checks work without reporting consent.

## Optional usage reporting

Run `ardo telemetry --help` to read the disclosure. To consent after reading it:

```bash
ardo telemetry enable --yes
```

Reporting counts `ardo build`, `ardo dev`, and `ardo preview` invocations by UTC
day. The SDK includes the Ardo version, a random tool-specific reporting identity,
and bounded OS, architecture, and CPU categories. Ardo supplies no project
identifier, repository information, command arguments, file paths, or source
content. Help, version, settings, unknown commands, and update checks are not
reported. Invoking the Ardo Vite plugin directly through `vite` is not counted.

The SDK records locally and hands due reports to its bounded background worker.
Reporting failures do not change build results or prevent a server from starting.
Reporting data is pseudonymous. See the service's
[privacy disclosure](https://app-tracking.sebastian-software.com/) for retention,
providers, and the information processed by the service.

You can inspect and change the saved choice:

```bash
ardo telemetry status
ardo telemetry preview
ardo telemetry disable
ardo telemetry delete
```

`status` shows ordinary reporting under `reporting`, plus the separate history,
publication, and profile decisions as JSON. `preview` shows unsent payloads without reporting credentials.
`disable` withdraws consent and discards unsent usage. `delete` also queues
authenticated deletion of previously sent data and starts a background delivery
attempt. Its result distinguishes `deletion: "pending"` from `"noIdentity"`;
`handedOff` describes local scheduling, not delivery. Inspect
`reporting.deletionPending` in a later `status` call for acknowledgement of a
previously pending deletion. Run `delete` again after
restoring connectivity to retry a pending deletion.

Settings live in the SDK's private Node profile below `~/.ardo`. The SDK owns the
consent, identity, locking, local aggregation, retention, and deletion lifecycle.
Ardo does not enable history, public usage publication, or shared profile linking.

CI reporting is disabled, and CI uses a separate SDK profile. `DO_NOT_TRACK=1`
and `APP_TRACKING_TELEMETRY=off` veto usage reporting even with saved consent.
`ARDO_OFFLINE=1` permits already-consented local counting but blocks delivery,
including deletion.

## Update checks

Interactive `build`, `dev`, and `preview` commands can show a newer stable Ardo
release on stderr. Automatic checks are disabled in CI and when stderr is not a
terminal. `--logLevel silent` suppresses update notices. You can also check explicitly:

```bash
ardo update-check
```

The command prints an offered SDK update as JSON, with `latestVersion`,
`releaseUrl`, and `stale`. It prints `null` when no notice is offered, including
disabled/offline checks and cache/notice suppression. `null` does not prove the
installed version is current. Operational failures return exit code 1. The command
does not install or execute an update. Update the `ardo` dependency with your package manager.

Checks use the service's [Ardo version endpoint](https://sebastian-app-tracking.b-cdn.net/v1/versions/ardo/github/stable),
without a reporting identity, installed version, or project data. The SDK owns the
transport, SemVer comparison, cache, locks, backoff, and notice throttling.
Fresh successful lookups suppress requests for an hour; failures and stale
responses back off from five minutes to an hour. Notices are offered at most
once per release per day, while a newer release can be offered immediately.
The SDK checks before command execution with a 200 ms network budget; local
filesystem and scheduling overhead are additional. Ardo awaits SDK completion
and reporting handoff before entering a long-lived dev or preview server.
The service can count aggregate functional requests independently of reporting.
The SDK sends DNT when `DO_NOT_TRACK=1` or `APP_TRACKING_TELEMETRY=off` is set,
while preserving functional updates.

Set `ARDO_UPDATE_CHECK=0` to disable automatic and explicit update requests.
Set `ARDO_OFFLINE=1` to block both update requests and reporting delivery.

## SDK integration

Ardo uses the published `@sebastian-software/app-tracking` 0.7 API, including
`CliClient` and its `UpdateClient`. The package supports Node.js 22, 24, and 26.
Ardo supplies its command categories, privacy disclosure, private profile location,
and output eligibility. The SDK owns reporting/settings sequencing and update
delivery. Ardo has no separate HTTP, cache, SemVer, or reporting-state implementation.
The dependency remains external to the CLI bundle so the SDK can locate its own worker.
