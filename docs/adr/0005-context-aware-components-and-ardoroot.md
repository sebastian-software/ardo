# ADR 0005: Context-Aware Components and ArdoRoot

## Status

Superseded by the JSX-first navigation model.

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

Components read content metadata from the Ardo context, while site chrome is composed explicitly in
JSX under `ArdoRoot`. `ArdoRoot` still combines Provider, Layout, Header, Sidebar, and Footer with
intelligent routing, but sidebar sections and header links are now React children instead of virtual
module props.

## Consequences

### Usage

```tsx
// Current: JSX-first root.tsx
import {
  ArdoGeneratedSidebar,
  ArdoHeader,
  ArdoRoot,
  ArdoRootLayout,
  ArdoSidebar,
  ArdoSidebarSection,
} from "ardo/ui"
import config from "virtual:ardo/config"

export default function Root() {
  return (
    <ArdoRootLayout>
      <ArdoRoot config={config}>
        <ArdoHeader />
        <ArdoSidebar>
          <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
            <ArdoGeneratedSidebar section="guide" />
          </ArdoSidebarSection>
        </ArdoSidebar>
      </ArdoRoot>
    </ArdoRootLayout>
  )
}
```

### Behavior

- `ArdoHeader` resolves title from config when no `title` prop is provided
- `ArdoFooter` reads project metadata automatically from config
- `ArdoSidebarSection` defines each rail item and its sidebar panel together
- `ArdoGeneratedSidebar` renders generated Markdown and TypeDoc navigation inside a section

### Benefits

- Drastically reduced boilerplate in `root.tsx`
- Zero-config mode via `ArdoRoot`
- Opt-in flexibility — props override context values
- Simpler onboarding for new users

### Trade-offs

- Implicit behavior can be harder to follow than explicit props
- Context dependency requires correct provider setup
