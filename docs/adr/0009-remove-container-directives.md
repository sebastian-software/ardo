# ADR 0009: Remove Container Directive Syntax

## Status

Accepted

## Context

Ardo supported two ways to create callout containers in MDX content:

1. **`:::` directive syntax** — powered by `remark-directive` and a custom `remarkContainers` plugin that transformed `:::tip`, `:::warning`, etc. into HTML or MDX JSX elements.
2. **JSX components** — `<Tip>`, `<Warning>`, `<Danger>`, `<Info>`, `<Note>`, `<CodeGroup>` — auto-registered via the MDX provider and available in all `.mdx` files without imports.

Both approaches produced identical output. The directive syntax existed as a convenience inherited from VitePress conventions, but in an MDX-first framework it created:

- **Redundancy**: Two ways to do the same thing, with no difference in capability.
- **Maintenance cost**: The `remarkContainers` and `remarkContainersMdx` plugins required ongoing maintenance and testing.
- **Extra dependencies**: `remark-directive` and `mdast-util-directive` added to the dependency tree solely for this feature.
- **User confusion**: Documentation had to explain both syntaxes, and users had to choose between them.

## Decision

Remove the `:::` container directive syntax entirely. JSX components (`<ArdoTip>`, `<ArdoWarning>`, etc.) are the single canonical way to create callouts and code groups in Ardo.

## Consequences

### Breaking changes

- The `remarkContainers` export from `ardo/markdown` is removed.
- The `transformMarkdown` pipeline no longer processes `:::` directives.
- Content using `:::tip`, `:::warning`, `:::code-group`, etc. must be migrated to JSX syntax.

### Migration

| Before                    | After                                                 |
| ------------------------- | ----------------------------------------------------- |
| `:::tip` ... `:::`        | `<ArdoTip>` ... `</ArdoTip>`                          |
| `:::warning` ... `:::`    | `<ArdoWarning>` ... `</ArdoWarning>`                  |
| `:::danger` ... `:::`     | `<ArdoDanger>` ... `</ArdoDanger>`                    |
| `:::info` ... `:::`       | `<ArdoInfo>` ... `</ArdoInfo>`                        |
| `:::note` ... `:::`       | `<ArdoNote>` ... `</ArdoNote>`                        |
| `:::tip[Custom Title]`    | `<ArdoTip title="Custom Title">`                      |
| `:::code-group` ... `:::` | `<ArdoCodeGroup labels="...">` ... `</ArdoCodeGroup>` |

### Benefits

- Two fewer npm dependencies (`remark-directive`, `mdast-util-directive`)
- Simpler MDX processing pipeline
- Single documented approach for callouts
- Less code to maintain (containers plugin + tests deleted)
- Consistent with the JSX-first design philosophy (see ADR 0007, 0008)
