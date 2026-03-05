# ADR 0011: Linked Versions and Commit Convention Without Scope

## Status

Accepted

## Context

The monorepo contains two packages: `ardo` (framework) and `create-ardo` (scaffold CLI). Separate versioning led to:

- **Version drift**: Core and CLI could have different versions, causing confusion.
- **Changelog attribution**: With scoped conventional commits (e.g. `feat(ardo):`), commits were only attributed to the matching package, even though changes often affect both.
- **Release complexity**: Separate release PRs and changelogs for each package.

## Decision

Release-please uses `linked-versions` with both packages in a single group. Commits use conventional commits **without scope** (e.g. `feat:` not `feat(ardo):`), so they are attributed to both packages.

## Consequences

### Configuration

```json
// release-please-config.json
{
  "plugins": [
    {
      "type": "linked-versions",
      "groupName": "ardo",
      "components": ["ardo", "create-ardo"]
    }
  ]
}
```

### Commit format

```
feat: add new feature          ✓ Correct
fix: fix bug                   ✓ Correct
feat(ardo): add new feature    ✗ Do not use
feat(scaffold): add feature    ✗ Do not use
```

### Benefits

- Both packages always have identical version numbers
- Single release PR for both packages
- Changelogs without redundant scope clutter
- Signals that both packages are developed as an integrated system

### Trade-offs

- No granular per-package versioning possible
- All commits appear in both changelogs
