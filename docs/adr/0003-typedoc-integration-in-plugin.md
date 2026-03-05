# ADR 0003: TypeDoc Integration Directly in the Ardo Plugin

## Status

Accepted

## Context

Originally TypeDoc was a separate step: users had to manually add `typedocPlugin()` to their Vite config and configure it. API documentation was additionally maintained as hand-written Markdown (four files totaling ~1,150 lines) that regularly drifted from the actual code.

This setup had several drawbacks:

- **Boilerplate**: Every project needed explicit TypeDoc plugin configuration.
- **Drift**: Hand-written API docs were not automatically updated.
- **Duplication**: JSDoc comments in code and separate Markdown docs.

## Decision

TypeDoc is offered as a built-in option in the `ardo()` Vite plugin. Activation via `ardo({ typedoc: true })` with sensible defaults (`entryPoints: ['./src/index.ts']`, `out: 'api-reference'`).

All hand-written API docs were removed.

## Consequences

### Usage

```ts
// Simplest form
ardo({ typedoc: true })

// With customization
ardo({
  typedoc: {
    entryPoints: ["./src/index.ts", "./src/utils.ts"],
    out: "api",
  },
})
```

### Benefits

- No separate plugin configuration needed
- API docs always in sync with the code
- Encourages JSDoc documentation directly in source code
- ~1,150 lines of manual Markdown removed

### Trade-offs

- TypeDoc becomes an optional dependency of the Ardo plugin
- Advanced TypeDoc configuration requires knowledge of TypeDoc options
