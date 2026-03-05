# ADR 0007: JSX Props over themeConfig

## Status

Accepted

## Context

Component behavior and styling was controlled through a centralized `themeConfig` object. This pattern had drawbacks:

- **Poor discoverability**: Available options were hidden in nested config objects.
- **Global impact**: Changes to `themeConfig` affected all instances of a component.
- **Indirection**: The path from config value to rendered output was hard to follow.

## Decision

Remove `themeConfig`. Component behavior is controlled through explicit JSX props. The component type itself determines the variant (e.g. `<ArdoTip>` instead of `themeConfig.containers.tip`).

## Consequences

### Before/after

```tsx
// Before: Centralized config
themeConfig: {
  containers: {
    tip: { title: "Tip", icon: "..." }
  }
}

// After: Explicit props
<ArdoTip title="Tip">Content</ArdoTip>
```

### Benefits

- IDE autocomplete shows available props directly
- Local overrides without global side effects
- Simpler mental model: JSX composition instead of config navigation
- Better TypeScript support through typed prop interfaces

### Trade-offs

- Repeated props for frequently used configurations
- No single place for global theme changes (instead, context-aware defaults, see ADR 0005)
