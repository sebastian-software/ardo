# ADR 0018: Use versioned agent instructions and a tested Basic example

## Status

Accepted, 2026-10-12. Simplified to one public example on 2026-10-13.
Supersedes [ADR 0011](0011-linked-versions-and-commit-convention.md)
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
instructions and one maintained Basic example with optional feature recipes. Keep a manual
installation guide
for people setting up Ardo without an agent.

Publish machine-readable documentation under the current major-version path as
well as the existing latest aliases. Match the Basic example to the installed
package's release tag; development uses a single checkout revision. Preserve
older documentation snapshots when deploying a new major.

The framework's configuration, plugins, typechecks, and builds validate the
integration. Instructions guide adaptation. Basic remains executable and
integration-tested, with isolated packed-package
checks for the base setup and its optional API configuration. Feature-specific
source and configuration live in internal fixtures; API, multiple-package,
content, deployment, runtime, and bare-layout coverage stays outside the example.
Tailwind becomes an optional integration rather than a starter
default. Release `ardo` as the sole published package; keep conventional commit
messages without scopes.

The example contains application source and required setup only. Maintainer
tests and hosting infrastructure stay outside it. A setup skill uses the same
versioned instructions rather than owning another template collection.

## Consequences

- Setup knowledge lives in the instructions, Basic example, and feature recipes
  rather than an additional generator template.
- Agent setup can adapt to application and workspace boundaries.
- People lose the one-command empty-directory scaffold and can use the manual
  guide or Basic example without an agent.
- Published `create-ardo` 5.x releases remain historical starters; they do not
  create or upgrade Ardo 6 projects. Existing sites require no structural migration
  solely because the starter is removed.
- Integration tests prove the example and package contracts, not every agent's
  interpretation or every existing application integration.

Revisit the decision if repeated real setup failures cannot be addressed with
instructions, the executable example, or framework validation.
