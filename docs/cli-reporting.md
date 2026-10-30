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

`status` shows the saved decision, effective collection restrictions, and pending
deletion as JSON. `preview` shows unsent payloads without reporting credentials.
`disable` withdraws consent and discards unsent usage. `delete` also queues
authenticated deletion of previously sent data and starts a background delivery
attempt. A successful CLI exit means the request was queued; inspect
`deletionPending` in `status` for acknowledgement. Run `delete` again after
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

The command prints release information as JSON. It returns exit code 1 when
checks are disabled or release information is unavailable. It does not install
or execute an update. Update the `ardo` dependency with your package manager.

Checks use `/v1/versions/ardo/github/stable` on the app-tracking service, without
a reporting identity, installed version, or project data. The Node SDK currently
provides event reporting; Ardo uses the service's version API directly for updates.
Successful lookups are cached locally for an hour, failures for a minute.
Requests have a 1.5-second deadline and are canceled when the command finishes.
The service can count aggregate functional requests independently of reporting;
Ardo sends DNT/GPC headers when `DO_NOT_TRACK=1` is set.

Set `ARDO_UPDATE_CHECK=0` to disable automatic and explicit update requests.
Set `ARDO_OFFLINE=1` to block both update requests and reporting delivery.

## SDK availability

The SDK is an optional Node-only dependency so its runtime constraints do not
prevent Ardo from installing or running. Reporting settings show an availability
error when the SDK is omitted or cannot initialize. Builds continue normally.
Reporting requires an SDK release registering Ardo's `cli.invocation` metric with
the `build`, `dev`, and `preview` categories. Update checks also require the
service to register Ardo's version route. These registrations are separate from
the Ardo integration.
