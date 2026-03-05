# ADR 0005: Context-Aware Components and ArdoRoot

## Status

Accepted

## Context

UI components like Header, Footer, and Sidebar required explicit props for configuration data (title, logo, sidebar items, etc.). Every `root.tsx` contained substantial boilerplate to pass data from virtual modules to components:

```tsx
// Before: Lots of boilerplate in root.tsx
<ArdoProvider config={config}>
  <ArdoLayout>
    <ArdoHeader title={config.title} logo={config.logo} />
    <ArdoSidebar items={sidebar} />
    <ArdoFooter project={config.project} />
  </ArdoLayout>
</ArdoProvider>
```

This pattern was error-prone and required users to understand internal data flows.

## Decision

Components read their defaults from the Ardo context (`useArdoConfig`, `useArdoSidebar`). Explicit props serve as overrides. A new `ArdoRoot` combo component combines Provider, Layout, Header, Sidebar, and Footer with intelligent routing (sidebar hidden on homepage).

## Consequences

### Usage

```tsx
// After: Minimal root.tsx
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"

export default function Root() {
  return (
    <ArdoRootLayout>
      <ArdoRoot config={config} sidebar={sidebar} />
    </ArdoRootLayout>
  )
}
```

### Behavior

- `ArdoHeader` resolves title from config when no `title` prop is provided
- `ArdoFooter` reads project metadata automatically from config
- `ArdoSidebar` renders from `virtual:ardo/sidebar` when no `items`/`children` are given
- `ArdoRoot` combines everything with sensible defaults

### Benefits

- Drastically reduced boilerplate in `root.tsx`
- Zero-config mode via `ArdoRoot`
- Opt-in flexibility — props override context values
- Simpler onboarding for new users

### Trade-offs

- Implicit behavior can be harder to follow than explicit props
- Context dependency requires correct provider setup
