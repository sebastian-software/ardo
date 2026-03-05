# ADR 0006: Ardo Prefix for All Public APIs

## Status

Accepted

## Context

Public components had inconsistent names. Some were generic (`Header`, `Footer`, `Sidebar`, `Tip`), which could cause namespace collisions with user components. The export path `ardo/theme` was also misleading since it contained UI components, not just theme definitions.

## Decision

All public components, hooks, and types receive the `Ardo` prefix. The export path is renamed from `ardo/theme` to `ardo/ui`.

## Consequences

### Naming convention

| Before                     | After                      |
| -------------------------- | -------------------------- |
| `Header`                   | `ArdoHeader`               |
| `Footer`                   | `ArdoFooter`               |
| `Sidebar`                  | `ArdoSidebar`              |
| `Tip`, `Warning`           | `ArdoTip`, `ArdoWarning`   |
| `CodeBlock`                | `ArdoCodeBlock`            |
| `Hero`, `Features`         | `ArdoHero`, `ArdoFeatures` |
| `import from "ardo/theme"` | `import from "ardo/ui"`    |

### Benefits

- Consistent, predictable naming convention
- No namespace collisions with user components
- Export path `ardo/ui` accurately reflects the contents
- Immediately recognizable which components come from Ardo

### Breaking changes

- All imports must be renamed
- Export path changes from `ardo/theme` to `ardo/ui`
