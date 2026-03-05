# ADR 0012: Storybook for UI Components

## Status

Accepted

## Context

UI components could only be tested and reviewed in the context of the full documentation site. There was no:

- **Isolated development**: No way to test individual components independently.
- **Visual documentation**: No overview of component variants and states.
- **Fast feedback**: Every change required navigating through the entire docs site.

## Decision

Integrate Storybook with Vanilla Extract support and a `withArdoProvider` decorator that wraps components with Provider, MemoryRouter, and mock data. Stories are maintained as `.stories.tsx` files alongside the components.

## Consequences

### Setup

- `.storybook/main.ts` with Vanilla Extract plugin and alias configuration
- `withArdoProvider` decorator provides theme context and routing
- Storybook build deployable to `/storybook/` subdirectory

### Scope

- 14+ story files for all major components (Hero, Features, Container, Tabs, CodeBlock, Header, Footer, etc.)
- Upgraded from Storybook v8 to v10 for current React Router/Vite compatibility

### Benefits

- Isolated component development independent of app context
- Visual documentation as a living styleguide
- Easier onboarding for contributors
- Faster feedback on UI changes

### Trade-offs

- Additional devDependencies (Storybook packages)
- Mock data in decorator must be updated when config schema changes
