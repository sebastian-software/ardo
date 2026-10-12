# ADR 0018: Use versioned agent instructions and tested reference projects

## Status

Accepted, 2026-10-12. Supersedes [ADR 0011](0011-linked-versions-and-commit-convention.md)
and [ADR 0013](0013-tailwind-css-v4-in-scaffold.md).

## Context

Ardo already provides an agent adoption guide and integration-tested reference
projects. The starter CLI maintains a separate project template, dependency
selection, package-manager handling, deployment options, and upgrade flow.
Existing projects require adaptation to their routing, styles, and workspace
boundaries. Maintaining both paths duplicates setup knowledge and release work.

## Decision

Starting with Ardo 6, remove `create-ardo` from the repository and release pipeline.
New sites, existing-project adoption, and upgrades use the same versioned agent
instructions and maintained reference projects. Keep a manual installation guide
for people setting up Ardo without an agent.

Publish machine-readable documentation under the current major-version path as
well as the existing latest aliases. Match reference projects to the installed
package's release tag; development uses a single checkout revision. Preserve
older documentation snapshots when deploying a new major.

The framework's configuration, plugins, typechecks, and builds validate the
integration. Instructions guide adaptation. References remain executable and
integration-tested, with isolated packed-package checks for product and library
documentation. Tailwind becomes an optional integration rather than a starter
default. Release `ardo` as the sole published package; keep conventional commit
messages without scopes.

## Consequences

- Setup knowledge lives in the instructions and reference projects rather than
  an additional generator template.
- Agent setup can adapt to application and workspace boundaries.
- People lose the one-command empty-directory scaffold and can use the manual
  guide or reference projects without an agent.
- Published `create-ardo` 5.x releases remain historical starters; they do not
  create or upgrade Ardo 6 projects. Existing sites require no structural migration
  solely because the starter is removed.
- Reference tests prove the example and package contracts, not every agent's
  interpretation or every existing application integration.

Revisit the decision if repeated real setup failures cannot be addressed with
instructions, executable references, or framework validation.
